import { z } from "zod";
import { MaintenanceStatus } from "@prisma/client";

export const createMaintenanceSchema = z.object({
  body: z.object({
    propertyId: z.number().int().positive("Property ID wajib diisi"),
    reportedById: z.number().int().positive().optional(),
    description: z
      .string()
      .min(1, "Deskripsi wajib diisi")
      .max(5000, "Deskripsi maksimal 5000 karakter"),
    status: z.nativeEnum(MaintenanceStatus).optional(),
  }),
});

export const updateMaintenanceSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    description: z.string().min(1).max(5000).optional(),
    status: z.nativeEnum(MaintenanceStatus).optional(),
  }),
});

export const getMaintenanceSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});

export const listMaintenancesSchema = z.object({
  query: z.object({
    propertyId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    status: z.nativeEnum(MaintenanceStatus).optional(),
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
