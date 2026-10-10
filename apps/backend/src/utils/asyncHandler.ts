import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wrapper agar error di dalam async route handler otomatis
 * diteruskan ke error handler middleware (tanpa try/catch berulang).
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
