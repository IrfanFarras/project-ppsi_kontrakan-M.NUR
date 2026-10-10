import { prisma } from "../config/prisma";
import { PropertyStatus } from "@prisma/client";
import { AppError } from "../utils/AppError";

interface CreatePropertyInput {
  code: string;
  name: string;
  address: string;
  rentAmount?: number;
  status?: PropertyStatus;
}

interface UpdatePropertyInput {
  code?: string;
  name?: string;
  address?: string;
  rentAmount?: number;
  status?: PropertyStatus;
}

export class PropertyService {
  /**
   * Ambil semua properties dengan pagination & filter
   */
  async getAll(options?: {
    status?: PropertyStatus;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = options?.status ? { status: options.status } : {};

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: "asc" },
        include: {
          contracts: {
            where: { status: "ACTIVE" },
            include: { tenant: true },
          },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return {
      data: properties,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ambil property by ID
   */
  async getById(id: number) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        contracts: {
          include: { tenant: true },
          orderBy: { createdAt: "desc" },
        },
        maintenances: {
          orderBy: { reportedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!property) {
      throw new AppError(404, `Property dengan ID ${id} tidak ditemukan`);
    }

    return property;
  }

  /**
   * Buat property baru
   */
  async create(input: CreatePropertyInput) {
    // Cek duplikasi code
    const existing = await prisma.property.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new AppError(
        400,
        `Property dengan code "${input.code}" sudah ada`
      );
    }

    const property = await prisma.property.create({
      data: {
        code: input.code,
        name: input.name,
        address: input.address,
        // Jika tidak dikirim, pakai default kolom di database
        ...(input.rentAmount !== undefined && { rentAmount: input.rentAmount }),
        status: input.status ?? "AVAILABLE",
      },
    });

    return property;
  }

  /**
   * Update property
   */
  async update(id: number, input: UpdatePropertyInput) {
    await this.getById(id); // pastikan property exists

    // Cek duplikasi code jika diubah
    if (input.code) {
      const existing = await prisma.property.findFirst({
        where: {
          code: input.code,
          id: { not: id },
        },
      });

      if (existing) {
        throw new AppError(
          400,
          `Property dengan code "${input.code}" sudah ada`
        );
      }
    }

    const updated = await prisma.property.update({
      where: { id },
      data: input,
    });

    return updated;
  }

  /**
   * Soft delete property
   * Hanya bisa delete kalau tidak ada active contract
   */
  async delete(id: number) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        contracts: { where: { status: "ACTIVE" } },
      },
    });

    if (!property) {
      throw new AppError(404, `Property dengan ID ${id} tidak ditemukan`);
    }

    if (property.contracts.length > 0) {
      throw new AppError(
        400,
        "Property tidak bisa dihapus karena masih memiliki kontrak aktif"
      );
    }

    await prisma.property.delete({ where: { id } });

    return { message: "Property berhasil dihapus" };
  }
}
