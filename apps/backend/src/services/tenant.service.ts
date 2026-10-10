import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

interface CreateTenantInput {
  fullName: string;
  phone: string;
  email: string;
  identityNumber: string;
}

interface UpdateTenantInput {
  fullName?: string;
  phone?: string;
  email?: string;
  identityNumber?: string;
}

export class TenantService {
  /**
   * Ambil semua tenants dengan pagination
   */
  async getAll(options?: { page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        skip,
        take: limit,
        orderBy: { fullName: "asc" },
        include: {
          contracts: {
            where: { status: "ACTIVE" },
            include: { property: true },
          },
        },
      }),
      prisma.tenant.count(),
    ]);

    return {
      data: tenants,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ambil tenant by ID
   */
  async getById(id: number) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        contracts: {
          include: {
            property: true,
            payments: {
              orderBy: { paymentDate: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        parkings: true,
      },
    });

    if (!tenant) {
      throw new AppError(404, `Tenant dengan ID ${id} tidak ditemukan`);
    }

    return tenant;
  }

  /**
   * Buat tenant baru
   */
  async create(input: CreateTenantInput) {
    // Validasi email unique jika diisi
    if (input.email) {
      const existing = await prisma.tenant.findFirst({
        where: { email: input.email },
      });

      if (existing) {
        throw new AppError(
          400,
          `Tenant dengan email "${input.email}" sudah ada`
        );
      }
    }

    const tenant = await prisma.tenant.create({
      data: {
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        identityNumber: input.identityNumber,
      },
    });

    return tenant;
  }

  /**
   * Update tenant
   */
  async update(id: number, input: UpdateTenantInput) {
    await this.getById(id); // pastikan tenant exists

    // Cek duplikasi email jika diubah
    if (input.email) {
      const existing = await prisma.tenant.findFirst({
        where: {
          email: input.email,
          id: { not: id },
        },
      });

      if (existing) {
        throw new AppError(
          400,
          `Tenant dengan email "${input.email}" sudah ada`
        );
      }
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: input,
    });

    return updated;
  }

  /**
   * Delete tenant
   * Hanya bisa delete kalau tidak ada active contract
   */
  async delete(id: number) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        contracts: { where: { status: "ACTIVE" } },
      },
    });

    if (!tenant) {
      throw new AppError(404, `Tenant dengan ID ${id} tidak ditemukan`);
    }

    if (tenant.contracts.length > 0) {
      throw new AppError(
        400,
        "Tenant tidak bisa dihapus karena masih memiliki kontrak aktif"
      );
    }

    await prisma.tenant.delete({ where: { id } });

    return { message: "Tenant berhasil dihapus" };
  }
}
