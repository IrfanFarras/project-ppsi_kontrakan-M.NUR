import { prisma } from "../config/prisma";
import { PaymentStatus, PaymentMethod } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { calculateLateFee, computeDueDate } from "../utils/lateFee.util";

interface CreatePaymentInput {
  contractId: number;
  amount: number;
  paymentDate: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
}

interface UpdatePaymentInput {
  amount?: number;
  paymentDate?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
}

export class PaymentService {
  // FINAL (2026-09-23): aturan denda keterlambatan — 1% dari rentAmount per
  // hari terlambat (dihitung dari tanggal jatuh tempo), maksimal 20% dari
  // rentAmount. Dipakai untuk menghitung denda tampilan (tidak disimpan
  // sebagai kolom terpisah di database). Implementasi ada di
  // `utils/lateFee.util.ts` (dipakai bareng oleh ReportService).
  static readonly LATE_FEE_RATE_PER_DAY = 0.01;
  static readonly LATE_FEE_MAX_RATE = 0.2;

  /**
   * Hitung denda keterlambatan untuk sebuah payment.
   * @param rentAmount jumlah sewa per periode (dari Contract.rentAmount)
   * @param dueDate tanggal jatuh tempo pembayaran
   * @param paymentDate tanggal pembayaran aktual (atau hari ini jika belum dibayar)
   */
  calculateLateFee(rentAmount: number, dueDate: Date, paymentDate: Date): number {
    return calculateLateFee(rentAmount, dueDate, paymentDate);
  }

  /**
   * Tempel field `lateFee` (turunan, tidak disimpan di DB) ke sebuah payment
   * yang sudah include relasi contract. Due date dihitung dari
   * Contract.startDate (lihat asumsi di utils/lateFee.util.ts).
   */
  private withLateFee<T extends { amount: any; paymentDate: Date; contract: { rentAmount: any; startDate: Date } }>(
    payment: T
  ): T & { lateFee: number } {
    const dueDate = computeDueDate(payment.contract.startDate, payment.paymentDate);
    const lateFee = calculateLateFee(
      Number(payment.contract.rentAmount),
      dueDate,
      payment.paymentDate
    );
    return { ...payment, lateFee };
  }

  /**
   * Ambil semua payments dengan pagination & filter
   */
  async getAll(options?: {
    contractId?: number;
    status?: PaymentStatus;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options?.contractId) where.contractId = options.contractId;
    if (options?.status) where.status = options.status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: "desc" },
        include: {
          contract: {
            include: {
              property: true,
              tenant: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      data: payments.map((p) => this.withLateFee(p)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ambil payment by ID
   */
  async getById(id: number) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true,
          },
        },
      },
    });

    if (!payment) {
      throw new AppError(404, `Payment dengan ID ${id} tidak ditemukan`);
    }

    return this.withLateFee(payment);
  }

  /**
   * Buat payment baru
   */
  async create(input: CreatePaymentInput) {
    // Validasi contract exists
    const contract = await prisma.contract.findUnique({
      where: { id: input.contractId },
    });

    if (!contract) {
      throw new AppError(
        404,
        `Contract dengan ID ${input.contractId} tidak ditemukan`
      );
    }

    // Validasi contract masih active
    if (contract.status !== "ACTIVE") {
      throw new AppError(
        400,
        "Tidak bisa menambahkan pembayaran untuk kontrak yang tidak aktif"
      );
    }

    const payment = await prisma.payment.create({
      data: {
        contractId: input.contractId,
        amount: input.amount,
        paymentDate: new Date(input.paymentDate),
        method: input.method,
        status: input.status ?? "PAID",
      },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true,
          },
        },
      },
    });

    return this.withLateFee(payment);
  }

  /**
   * Update payment
   */
  async update(id: number, input: UpdatePaymentInput) {
    await this.getById(id); // pastikan payment exists

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        amount: input.amount,
        paymentDate: input.paymentDate
          ? new Date(input.paymentDate)
          : undefined,
        method: input.method,
        status: input.status,
      },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true,
          },
        },
      },
    });

    return this.withLateFee(updated);
  }

  /**
   * Delete payment
   */
  async delete(id: number) {
    await this.getById(id); // pastikan payment exists

    await prisma.payment.delete({ where: { id } });

    return { message: "Payment berhasil dihapus" };
  }
}
