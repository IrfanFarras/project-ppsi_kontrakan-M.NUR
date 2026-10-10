import { API_BASE_URL } from "@rental/api-client";
import { getSession, signOut } from "next-auth/react";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

/**
 * Cache token backend di memori supaya request paralel (mis. dashboard = 6 request)
 * tidak masing-masing memanggil /api/auth/session. Hanya token valid yang di-cache;
 * cache dibuang saat 401.
 */
const TOKEN_TTL_MS = 60_000;
let cachedToken: { value: string; expires: number } | null = null;
let inflightToken: Promise<string | null> | null = null;

async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.value;

  if (!inflightToken) {
    inflightToken = getSession()
      .then((session) => {
        const token = session?.accessToken ?? null;
        if (token) cachedToken = { value: token, expires: Date.now() + TOKEN_TTL_MS };
        return token;
      })
      .finally(() => {
        inflightToken = null;
      });
  }
  return inflightToken;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  // Add query params if present
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Sertakan JWT backend dari session NextAuth (hanya di browser)
  const token = await getAccessToken();

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  });

  // Token backend kedaluwarsa / tidak valid -> paksa login ulang
  if (response.status === 401 && typeof window !== 'undefined') {
    cachedToken = null;
    await signOut({ callbackUrl: '/login' });
  }

  if (!response.ok) {
    // Format error backend: { success: false, message, errors?: ZodFlattenedError }
    const errorData = await response.json().catch(() => null);
    const base = errorData?.message || errorData?.error || `HTTP ${response.status}`;
    const fieldErrors: unknown[] = errorData?.errors?.fieldErrors
      ? Object.values(errorData.errors.fieldErrors).flat()
      : [];
    const formErrors: unknown[] = errorData?.errors?.formErrors ?? [];
    const detail = [...fieldErrors, ...formErrors].filter(Boolean).join(', ');
    throw new Error(detail ? `${base}: ${detail}` : base);
  }

  // DELETE bisa membalas 204/body kosong: jangan paksa parse JSON
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
