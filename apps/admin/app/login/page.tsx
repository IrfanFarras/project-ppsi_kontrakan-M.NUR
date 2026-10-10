"use client";

import { signIn } from "next-auth/react";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, fieldClass } from "@rental/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah.");
      } else {
        router.push("/admin");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi sebentar lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
            KM
          </div>
          <span className="text-sm font-semibold text-ink">Kontrakan M. Nur</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h1 className="text-lg font-semibold tracking-tight text-ink">Masuk</h1>
          <p className="text-sm text-ink-muted mt-1">Gunakan akun pemilik untuk membuka panel admin.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate={false}>
            {error && (
              <p
                role="alert"
                className="text-sm text-error bg-error-bg border border-error-border rounded-lg px-3 py-2"
              >
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-ink">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
