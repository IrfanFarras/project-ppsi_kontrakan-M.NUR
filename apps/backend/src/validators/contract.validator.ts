import { z } from "zod";
import { ContractStatus } from "@prisma/client";

export const createContractSchema = z.object({
  body: z.object({
    propertyId: z.number().int().positive("Property ID wajib diisi"),
    tenantId: z.number().int().positive("Tenant ID wajib diisi"),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Format tanggal mulai tidak valid",
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Format tanggal akhir tidak valid",
    }),
    rentAmount: z
      .number()
      .positive("Harga sewa harus lebih besar dari 0")
      .or(z.string().transform((val) => parseFloat(val))),
    previousContractId: z.number().int().positive().optional(),
  }),
});

export const updateContractSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)))
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)))
      .optional(),
    rentAmount: z
      .number()
      .positive()
      .or(z.string().transform((val) => parseFloat(val)))
      .optional(),
    status: z.nativeEnum(ContractStatus).optional(),
  }),
});

export const getContractSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});

export const listContractsSchema = z.object({
  query: z.object({
    propertyId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    tenantId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    status: z.nativeEnum(ContractStatus).optional(),
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
