import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { calculateLateFee, computeDueDate } from "../utils/lateFee.util";

export class ReportService {
  /**
   * Laporan keuangan bulanan
   * GET /api/reports/monthly?year=2026&month=9
   */
  async getMonthlyReport(year: number, month: number) {
    // Validasi input
    if (year < 2000 || year > 2100) {
      throw new AppError(400, "Tahun tidak valid");
    }

    if (month < 1 || month > 12) {
      throw new AppError(400, "Bulan harus antara 1-12");
    }

    // Rentang tanggal untuk bulan tersebut
    const startDate = new Date(year, month - 1, 1); // month di JS 0-indexed
    const endDate = new Date(year, month, 1); // awal bulan berikutnya

    // 1. Ambil semua pembayaran di bulan tersebut
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true,
          },
        },
      },
      orderBy: {
        paymentDate: "asc",
      },
    });

    // 2. Hitung total pemasukan & jumlah pembayaran lunas
    const totalIncome = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const paidPaymentsCount = payments.filter(
      (p) => p.status === "PAID"
    ).length;

    // 3. Ambil semua contract aktif di bulan tersebut
    const activeContracts = await prisma.contract.findMany({
      where: {
        status: "ACTIVE",
        startDate: {
          lte: endDate,
        },
        endDate: {
          gte: startDate,
        },
      },
      include: {
        property: true,
        tenant: true,
        payments: {
          where: {
            paymentDate: {
              gte: startDate,
              lt: endDate,
            },
          },
        },
      },
    });

    // 4. Identifikasi tenant/contract yang belum bayar periode tersebut
    // Logika: contract aktif yang TIDAK punya payment PAID di bulan ini
    // Denda dihitung sebagai estimasi berjalan (belum tentu final, karena
    // belum ada payment record) — asumsi due date lihat utils/lateFee.util.ts.
    const today = new Date();
    const unpaidContracts = activeContracts
      .filter((contract) => {
        const hasPaidPayment = contract.payments.some(
          (payment) => payment.status === "PAID"
        );
        return !hasPaidPayment;
      })
      .map((contract) => {
        const dueDate = computeDueDate(contract.startDate, endDate < today ? endDate : today);
        const referenceDate = today < dueDate ? dueDate : today;
        const estimatedLateFee = calculateLateFee(
          Number(contract.rentAmount),
          dueDate,
          referenceDate
        );
        return {
          contractId: contract.id,
          property: {
            id: contract.property.id,
            code: contract.property.code,
            name: contract.property.name,
          },
          tenant: {
            id: contract.tenant.id,
            fullName: contract.tenant.fullName,
            phone: contract.tenant.phone,
          },
          rentAmount: contract.rentAmount,
          startDate: contract.startDate,
          endDate: contract.endDate,
          dueDate,
          estimatedLateFee,
        };
      });

    return {
      period: {
        year,
        month,
        monthName: new Date(year, month - 1).toLocaleString("id-ID", {
          month: "long",
        }),
      },
      summary: {
        totalIncome,
        paidPaymentsCount,
        totalPayments: payments.length,
        unpaidContractsCount: unpaidContracts.length,
        activeContractsCount: activeContracts.length,
      },
      payments: payments.map((p) => {
        const dueDate = computeDueDate(p.contract.startDate, p.paymentDate);
        const lateFee = calculateLateFee(Number(p.contract.rentAmount), dueDate, p.paymentDate);
        return {
          id: p.id,
          amount: p.amount,
          paymentDate: p.paymentDate,
          status: p.status,
          method: p.method,
          lateFee,
          contract: {
            id: p.contract.id,
            property: {
              code: p.contract.property.code,
              name: p.contract.property.name,
            },
            tenant: {
              fullName: p.contract.tenant.fullName,
            },
          },
        };
      }),
      unpaidContracts,
    };
  }
}
