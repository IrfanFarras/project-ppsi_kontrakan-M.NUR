import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

/**
 * Error handler dasar & terpusat.
 * Bentuk response konsisten: { success: false, message, errors? }
 */
export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Error validasi Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validasi gagal",
      errors: err.flatten(),
    });
    return;
  }

  // Error terkontrol yang sengaja dilempar aplikasi
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Error tak terduga
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server",
    ...(env.NODE_ENV !== "production" && {
      detail: err instanceof Error ? err.message : String(err),
    }),
  });
}
