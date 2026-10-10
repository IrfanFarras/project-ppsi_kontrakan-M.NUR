import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

interface CreateParkingInput {
  propertyId?: number;
  tenantId?: number;
  vehicleType?: string;
  plateNumber?: string;
}

interface UpdateParkingInput {
  propertyId?: number | null;
  tenantId?: number | null;
  vehicleType?: string | null;
  plateNumber?: string | null;
}

export class ParkingService {
  /**
   * Ambil semua parking dengan pagination & filter
   */
  async getAll(options?: {
    propertyId?: number;
    tenantId?: number;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(options?.propertyId ? { propertyId: options.propertyId } : {}),
      ...(options?.tenantId ? { tenantId: options.tenantId } : {}),
    };

    const [parkings, total] = await Promise.all([
      prisma.parking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          property: true,
          tenant: true,
        },
      }),
      prisma.parking.count({ where }),
    ]);

    return {
      data: parkings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const parking = await prisma.parking.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: true,
      },
    });

    if (!parking) {
      throw new AppError(404, `Parking dengan ID ${id} tidak ditemukan`);
    }

    return parking;
  }

  async create(input: CreateParkingInput) {
    if (input.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: input.propertyId },
      });

      if (!property) {
        throw new AppError(
          400,
          `Property dengan ID ${input.propertyId} tidak ditemukan`
        );
      }
    }

    if (input.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
      });

      if (!tenant) {
        throw new AppError(
          400,
          `Tenant dengan ID ${input.tenantId} tidak ditemukan`
        );
      }
    }

    const parking = await prisma.parking.create({
      data: {
        propertyId: input.propertyId,
        tenantId: input.tenantId,
        vehicleType: input.vehicleType,
        plateNumber: input.plateNumber,
      },
    });

    return parking;
  }

  async update(id: number, input: UpdateParkingInput) {
    await this.getById(id); // pastikan exists

    if (input.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: input.propertyId },
      });

      if (!property) {
        throw new AppError(
          400,
          `Property dengan ID ${input.propertyId} tidak ditemukan`
        );
      }
    }

    if (input.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
      });

      if (!tenant) {
        throw new AppError(
          400,
          `Tenant dengan ID ${input.tenantId} tidak ditemukan`
        );
      }
    }

    const updated = await prisma.parking.update({
      where: { id },
      data: {
        propertyId: input.propertyId === null ? null : input.propertyId,
        tenantId: input.tenantId === null ? null : input.tenantId,
        vehicleType: input.vehicleType === null ? null : input.vehicleType,
        plateNumber: input.plateNumber === null ? null : input.plateNumber,
      },
    });

    return updated;
  }

  async delete(id: number) {
    await this.getById(id); // pastikan exists

    await prisma.parking.delete({ where: { id } });

    return { message: "Parking berhasil dihapus" };
  }
}
