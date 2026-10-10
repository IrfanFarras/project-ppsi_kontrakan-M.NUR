import { prisma } from "../config/prisma";
import { OrderStatus } from "@prisma/client";
import { AppError } from "../utils/AppError";

interface CreateOrderInput {
  propertyId: number;
  tenantFullName: string;
  tenantPhone: string;
  tenantEmail: string;
  requestedStartDate: string;
  requestedEndDate: string;
}

export class OrderService {
  async getAll() {
    return await prisma.order.findMany({
      include: { property: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: number) {
    const order = await prisma.order.findUnique({
      where: { id },
      // Jangan pernah mengembalikan passwordHash: pilih field User secara eksplisit
      include: {
        property: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!order) throw new AppError(404, "Order tidak ditemukan");
    return order;
  }

  async create(input: CreateOrderInput) {
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
    });

    if (!property || property.status !== "AVAILABLE") {
      throw new AppError(400, "Property tidak tersedia untuk disewa");
    }

    const startDate = new Date(input.requestedStartDate);
    const endDate = new Date(input.requestedEndDate);
    if (endDate <= startDate) throw new AppError(400, "Tanggal tidak valid");

    return await prisma.order.create({
      data: {
        propertyId: input.propertyId,
        tenantFullName: input.tenantFullName,
        tenantPhone: input.tenantPhone,
        tenantEmail: input.tenantEmail,
        requestedStartDate: startDate,
        requestedEndDate: endDate,
        rentAmountSnapshot: property.rentAmount,
        status: "PENDING",
      },
    });
  }

  async updateStatus(id: number, status: OrderStatus, reason?: string, identityNumber?: string) {
    const order = await this.getById(id);

    if (order.status !== "PENDING") {
      throw new AppError(400, "Hanya order status PENDING yang bisa diubah");
    }

    if (status === "REJECTED") {
      if (!reason) throw new AppError(400, "Alasan penolakan wajib diisi");
      return await prisma.order.update({
        where: { id },
        data: { status: "REJECTED", rejectionReason: reason },
      });
    }

    if (status === "CANCELLED") {
      return await prisma.order.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    }

    if (status === "APPROVED") {
      return await prisma.$transaction(async (tx) => {
        // 1. Refetch Property & Validasi ketersediaan serta harga sewa
        const property = await tx.property.findUnique({
          where: { id: order.propertyId },
        });

        if (!property || property.status !== "AVAILABLE") {
          throw new AppError(400, "Property sudah tidak tersedia");
        }

        // Hardening: Tolak approve jika rentAmount property <= 0
        const rentAmountNumber = Number(property.rentAmount);
        if (isNaN(rentAmountNumber) || rentAmountNumber <= 0) {
          throw new AppError(
            400,
            "Harga sewa property belum diatur. Silakan update harga sewa property terlebih dahulu sebelum menyetujui order."
          );
        }

        // 2. Cari atau buat Tenant
        let tenant = await tx.tenant.findUnique({
          where: { email: order.tenantEmail },
        });

        if (!tenant) {
          if (!identityNumber) {
            throw new AppError(400, "identityNumber wajib untuk penyewa baru");
          }
          tenant = await tx.tenant.create({
            data: {
              fullName: order.tenantFullName,
              phone: order.tenantPhone,
              email: order.tenantEmail,
              identityNumber: identityNumber,
            },
          });
        }

        // 3. Buat Contract aktif menggunakan rentAmountSnapshot dari order
        await tx.contract.create({
          data: {
            propertyId: order.propertyId,
            tenantId: tenant.id,
            startDate: order.requestedStartDate,
            endDate: order.requestedEndDate,
            rentAmount: order.rentAmountSnapshot,
            status: "ACTIVE",
          },
        });

        // 4. Ubah status Property menjadi OCCUPIED
        await tx.property.update({
          where: { id: order.propertyId },
          data: { status: "OCCUPIED" },
        });

        // 5. Ubah status Order menjadi APPROVED
        return await tx.order.update({
          where: { id },
          data: { status: "APPROVED" },
        });
      });
    }

    throw new AppError(400, "Status tidak valid");
  }
}
