import { z } from "zod";
import { PropertyStatus } from "@prisma/client";

export const createPropertySchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(1, "Code wajib diisi")
      .max(50, "Code maksimal 50 karakter"),
    name: z
      .string()
      .min(1, "Nama wajib diisi")
      .max(255, "Nama maksimal 255 karakter"),
    address: z.string().min(1, "Alamat wajib diisi"),
    rentAmount: z
      .number()
      .min(0, "Tarif sewa tidak boleh negatif")
      .or(z.string().transform((val) => parseFloat(val)))
      .optional(),
    status: z.nativeEnum(PropertyStatus).optional(),
  }),
});

export const updatePropertySchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    code: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(255).optional(),
    address: z.string().min(1).optional(),
    rentAmount: z
      .number()
      .min(0, "Tarif sewa tidak boleh negatif")
      .or(z.string().transform((val) => parseFloat(val)))
      .optional(),
    status: z.nativeEnum(PropertyStatus).optional(),
  }),
});

export const getPropertySchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});

export const listPropertiesSchema = z.object({
  query: z.object({
    status: z.nativeEnum(PropertyStatus).optional(),
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
