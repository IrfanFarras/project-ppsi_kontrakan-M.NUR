import { z } from "zod";

export const createTenantSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(1, "Nama lengkap wajib diisi")
      .max(255, "Nama maksimal 255 karakter"),
    phone: z
      .string()
      .min(1, "Nomor telepon wajib diisi")
      .max(50, "Nomor telepon maksimal 50 karakter"),
    email: z.string().email("Format email tidak valid").min(1, "Email wajib diisi"),
    identityNumber: z
      .string()
      .min(1, "Nomor identitas (KTP) wajib diisi")
      .max(50, "Nomor identitas maksimal 50 karakter"),
  }),
});

export const updateTenantSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    fullName: z.string().min(1).max(255).optional(),
    phone: z.string().min(1).max(50).optional(),
    email: z.string().email("Format email tidak valid").min(1).optional(),
    identityNumber: z.string().min(1).max(50).optional(),
  }),
});

export const getTenantSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});

export const listTenantsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20)),
  }),
});
