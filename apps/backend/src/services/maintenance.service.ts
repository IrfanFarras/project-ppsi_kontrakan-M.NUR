import { prisma } from "../config/prisma";
import { MaintenanceStatus } from "@prisma/client";
import { AppError } from "../utils/AppError";

interface CreateMaintenanceInput {
  propertyId: number;
  reportedById?: number;
  description: string;
  status?: MaintenanceStatus;
}

interface UpdateMaintenanceInput {
  description?: string;
  status?: MaintenanceStatus;
}

export class MaintenanceService {
  /**
   * Ambil semua maintenance dengan pagination & filter
   */
  async getAll(options?: {
    propertyId?: number;
    status?: MaintenanceStatus;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(options?.propertyId ? { propertyId: options.propertyId } : {}),
      ...(options?.status ? { status: options.status } : {}),
    };

    const [maintenances, total] = await Promise.all([
      prisma.maintenance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reportedAt: "desc" },
        include: {
          property: true,
          reportedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.maintenance.count({ where }),
    ]);

    return {
      data: maintenances,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
      include: {
        property: true,
        reportedBy: { select: { id: true, name: true } },
        expenses: true,
      },
    });

    if (!maintenance) {
      throw new AppError(404, `Maintenance dengan ID ${id} tidak ditemukan`);
    }

    return maintenance;
  }

  async create(input: CreateMaintenanceInput) {
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
    });

    if (!property) {
      throw new AppError(
        400,
        `Property dengan ID ${input.propertyId} tidak ditemukan`
      );
    }

    const maintenance = await prisma.maintenance.create({
      data: {
        propertyId: input.propertyId,
        reportedById: input.reportedById,
        description: input.description,
        status: input.status ?? "REPORTED",
      },
    });

    return maintenance;
  }

  async update(id: number, input: UpdateMaintenanceInput) {
    const existing = await this.getById(id);

    // Set completedAt otomatis saat status berpindah ke COMPLETED,
    // dan bersihkan kembali kalau status ditarik mundur dari COMPLETED.
    const completedAt =
      input.status === "COMPLETED" && existing.status !== "COMPLETED"
        ? new Date()
        : input.status && input.status !== "COMPLETED"
        ? null
        : undefined;

    const updated = await prisma.maintenance.update({
      where: { id },
      data: {
        description: input.description,
        status: input.status,
        ...(completedAt !== undefined ? { completedAt } : {}),
      },
    });

    return updated;
  }

  async delete(id: number) {
    await this.getById(id); // pastikan exists

    await prisma.maintenance.delete({ where: { id } });

    return { message: "Maintenance berhasil dihapus" };
  }
}
