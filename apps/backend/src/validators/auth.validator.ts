import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    // `role` sengaja tidak diterima dari client: public registration
    // hanya boleh menghasilkan TENANT (lihat AuthService.register).
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(1, "Password wajib diisi"),
  }),
});
