import "dotenv/config";
import { z } from "zod";

/**
 * Validasi environment variables dasar menggunakan Zod.
 * Fail-fast: jika env wajib tidak ada/salah format, server tidak akan start.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z
    .string()
    .default("4000")
    .transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(10, "JWT_SECRET wajib diisi dan minimal 10 karakter"),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Konfigurasi environment tidak valid:");
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
