import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const createOrderSchema = z.object({
  body: z.object({
    propertyId: z.number().int("propertyId harus angka bulat"),
    tenantFullName: z.string().min(1, "Nama lengkap wajib diisi"),
    tenantPhone: z.string().min(1, "Nomor telepon wajib diisi"),
    tenantEmail: z.string().email("Format email tidak valid"),
    requestedStartDate: z.string().datetime("Format tanggal mulai tidak valid"),
    requestedEndDate: z.string().datetime("Format tanggal akhir tidak valid"),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    status: z.nativeEnum(OrderStatus),
    rejectionReason: z.string().optional(),
    identityNumber: z.string().optional(),
  }),
});

export const getOrderSchema = z.object({
  params: z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
  }),
});
