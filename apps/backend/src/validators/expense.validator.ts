import { z } from "zod";

export const createExpenseSchema = z.object({
  body: z.object({
    propertyId: z.number().int().positive("Property ID wajib diisi"),
    maintenanceId: z.number().int().positive().optional(),
    category: z
      .string()
      .min(1, "Kategori wajib diisi")
      .max(100, "Kategori maksimal 100 karakter"),
    amount: z
      .number()
      .positive("Jumlah expense harus lebih besar dari 0")
      .or(z.string().transform((val) => parseFloat(val))),
    expenseDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Format tanggal expense tidak valid",
    }),
  }),
});

export const updateExpenseSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    maintenanceId: z.number().int().positive().nullable().optional(),
    category: z.string().min(1).max(100).optional(),
    amount: z
      .number()
      .positive()
      .or(z.string().transform((val) => parseFloat(val)))
      .optional(),
    expenseDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)))
      .optional(),
  }),
});

export const getExpenseSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});

export const listExpensesSchema = z.object({
  query: z.object({
    propertyId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    maintenanceId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
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
