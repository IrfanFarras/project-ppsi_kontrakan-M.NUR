import { prisma } from "../config/prisma";
import { ContractStatus } from "@prisma/client";
import { AppError } from "../utils/AppError";

interface CreateContractInput {
  propertyId: number;
  tenantId: number;
  startDate: string;
  endDate: string;
  rentAmount: number;
  previousContractId?: number;
}

interface UpdateContractInput {
  startDate?: string;
  endDate?: string;
  rentAmount?: number;
  status?: ContractStatus;
}

export class ContractService {
  /**
   * Ambil semua contracts dengan pagination & filter
   */
  async getAll(options?: {
    propertyId?: number;
    tenantId?: number;
    status?: ContractStatus;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options?.propertyId) where.propertyId = options.propertyId;
    if (options?.tenantId) where.tenantId = options.tenantId;
    if (options?.status) where.status = options.status;

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          property: true,
          tenant: true,
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    return {
      data: contracts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ambil contract by ID
   */
  async getById(id: number) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: true,
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        previousContract: true,
        renewedInto: true,
      },
    });

    if (!contract) {
      throw new AppError(404, `Contract dengan ID ${id} tidak ditemukan`);
    }

    return contract;
  }

  /**
   * Buat contract baru
   * VALIDASI: satu property hanya boleh punya 1 active contract
   */
  async create(input: CreateContractInput) {
    // Validasi property exists
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
    });
    if (!property) {
      throw new AppError(404, `Property dengan ID ${input.propertyId} tidak ditemukan`);
    }

    // Validasi tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: input.tenantId },
    });
    if (!tenant) {
      throw new AppError(404, `Tenant dengan ID ${input.tenantId} tidak ditemukan`);
    }

    // VALIDASI: property tidak boleh punya active contract lain
    const existingActiveContract = await prisma.contract.findFirst({
      where: {
        propertyId: input.propertyId,
        status: "ACTIVE",
      },
    });

    if (existingActiveContract) {
      throw new AppError(
        400,
        `Property ini sudah memiliki kontrak aktif (Contract ID: ${existingActiveContract.id})`
      );
    }

    // Validasi tanggal
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (endDate <= startDate) {
      throw new AppError(400, "Tanggal akhir harus setelah tanggal mulai");
    }

    // Validasi previousContract jika renewal
    if (input.previousContractId) {
      const prevContract = await prisma.contract.findUnique({
        where: { id: input.previousContractId },
      });

      if (!prevContract) {
        throw new AppError(
          404,
          `Previous contract dengan ID ${input.previousContractId} tidak ditemukan`
        );
      }

      if (prevContract.propertyId !== input.propertyId) {
        throw new AppError(
          400,
          "Previous contract harus untuk property yang sama"
        );
      }
    }

    const contract = await prisma.contract.create({
      data: {
        propertyId: input.propertyId,
        tenantId: input.tenantId,
        startDate,
        endDate,
        rentAmount: input.rentAmount,
        previousContractId: input.previousContractId,
        status: "ACTIVE",
      },
      include: {
        property: true,
        tenant: true,
      },
    });

    // Update property status menjadi OCCUPIED
    await prisma.property.update({
      where: { id: input.propertyId },
      data: { status: "OCCUPIED" },
    });

    return contract;
  }

  // FINAL (2026-09-23): state machine ContractStatus — lihat schema.prisma
  // (enum ContractStatus) untuk daftar transisi lengkap.
  private static readonly ALLOWED_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
    ACTIVE: ["EXPIRED", "TERMINATED", "RENEWED"],
    EXPIRED: ["RENEWED"],
    TERMINATED: [],
    RENEWED: [],
  };

  /**
   * Update contract
   */
  async update(id: number, input: UpdateContractInput) {
    const existing = await this.getById(id);

    // VALIDASI: state machine ContractStatus
    if (input.status && input.status !== existing.status) {
      const allowed = ContractService.ALLOWED_TRANSITIONS[existing.status];
      if (!allowed.includes(input.status)) {
        throw new AppError(
          400,
          `Transisi status contract dari ${existing.status} ke ${input.status} tidak diperbolehkan`
        );
      }
    }

    // Validasi tanggal jika diubah
    if (input.startDate || input.endDate) {
      const startDate = input.startDate
        ? new Date(input.startDate)
        : existing.startDate;
      const endDate = input.endDate ? new Date(input.endDate) : existing.endDate;

      if (endDate <= startDate) {
        throw new AppError(400, "Tanggal akhir harus setelah tanggal mulai");
      }
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        rentAmount: input.rentAmount,
        status: input.status,
      },
      include: {
        property: true,
        tenant: true,
        payments: true,
      },
    });

    // Jika status berubah dari ACTIVE, update property status
    if (input.status && input.status !== "ACTIVE" && existing.status === "ACTIVE") {
      await prisma.property.update({
        where: { id: existing.propertyId },
        data: { status: "AVAILABLE" },
      });
    }

    return updated;
  }

  /**
   * Delete contract (soft delete via status TERMINATED)
   */
  async delete(id: number) {
    const contract = await this.getById(id);

    // Cek apakah ada payment terkait
    const paymentCount = await prisma.payment.count({
      where: { contractId: id },
    });

    if (paymentCount > 0) {
      throw new AppError(
        400,
        `Contract tidak bisa dihapus karena sudah memiliki ${paymentCount} pembayaran. Gunakan status TERMINATED untuk menonaktifkan.`
      );
    }

    await prisma.contract.delete({ where: { id } });

    // Update property status jadi AVAILABLE
    await prisma.property.update({
      where: { id: contract.propertyId },
      data: { status: "AVAILABLE" },
    });

    return { message: "Contract berhasil dihapus" };
  }
}
