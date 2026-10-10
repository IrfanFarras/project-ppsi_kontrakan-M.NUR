import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

/**
 * Menangani request ke route yang tidak terdaftar.
 */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(new AppError(404, `Route tidak ditemukan: ${req.method} ${req.originalUrl}`));
}
