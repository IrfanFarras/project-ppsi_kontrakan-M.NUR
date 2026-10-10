import { Request, Response } from "express";

/**
 * GET /api/health
 * Basic health-check — hanya mengecek server hidup, TIDAK mengecek DB
 * (pengecekan koneksi DB bisa ditambahkan di phase berikutnya jika diperlukan).
 */
export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: "OK",
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
  });
}
