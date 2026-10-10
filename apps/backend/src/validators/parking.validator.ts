import { z } from "zod";

export const createParkingSchema = z.object({
  body: z
    .object({
      propertyId: z.number().int().positive().optional(),
      tenantId: z.number().int().positive().optional(),
      vehicleType: z.string().max(50).optional(),
      plateNumber: z.string().max(20).optional(),
    })
    // FINAL (2026-09-23): relasi Parking ke Property DAN/ATAU Tenant,
    // minimal salah satu wajib diisi.
    .refine((data) => !!data.propertyId || !!data.tenantId, {
      message: "Minimal salah satu dari propertyId atau tenantId wajib diisi",
      path: ["propertyId"],
    }),
});

export const updateParkingSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    propertyId: z.number().int().positive().nullable().optional(),
    tenantId: z.number().int().positive().nullable().optional(),
    vehicleType: z.string().max(50).nullable().optional(),
    plateNumber: z.string().max(20).nullable().optional(),
  }),
});

export const getParkingSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});

export const listParkingsSchema = z.object({
  query: z.object({
    propertyId: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    tenantId: z
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
