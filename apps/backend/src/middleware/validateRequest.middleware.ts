import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";

/**
 * Middleware generik untuk validasi request menggunakan Zod schema.
 * Reusable untuk semua module/fitur di masa depan — tidak spesifik ke satu domain.
 *
 * Contoh pemakaian (nanti, saat fitur dibuat):
 *   router.post("/", validateRequest(createXSchema), controller.create)
 */
export function validateRequest(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;

      next();
    } catch (err) {
      next(err); // diteruskan ke errorHandlerMiddleware (menangani ZodError)
    }
  };
}
