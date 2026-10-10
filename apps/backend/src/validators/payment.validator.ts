import { z } from "zod";
import { PaymentStatus, PaymentMethod } from "@prisma/client";

export const createPaymentSchema = z.object({
  body: z.object({
    contractId: z.number().int().positive("Contract ID wajib diisi"),
    amount: z
      .number()
      .positive("Jumlah pembayaran harus lebih besar dari 0")
      .or(z.string().transform((val) => parseFloat(val))),
    paymentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Format tanggal pembayaran tidak valid",
    }),
    method: z.nativeEnum(PaymentMethod).optional(),
    status: z.nativeEnum(PaymentStatus).optional(),
  }),
});

export const updatePaymentSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    amount: z
      .number()
      .positive()
      .or(z.string().transform((val) => parseFloat(val)))
      .optional(),
    paymentDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)))
      .optional(),
    method: z.nativeEnum(PaymentMethod).optional(),
    status: z.nativeEnum(PaymentStatus).optional(),
  }),
});

export const getPaymentSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});

export const listPaymentsSchema = z.object({
  query: z.object({
    contractId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    status: z.nativeEnum(PaymentStatus).optional(),
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
