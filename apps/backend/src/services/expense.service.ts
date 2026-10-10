import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

interface CreateExpenseInput {
  propertyId: number;
  maintenanceId?: number;
  category: string;
  amount: number;
  expenseDate: string | Date;
}

interface UpdateExpenseInput {
  category?: string;
  amount?: number;
  expenseDate?: string | Date;
  maintenanceId?: number | null;
}

export class ExpenseService {
  /**
   * Ambil semua expense dengan pagination & filter
   */
  async getAll(options?: {
    propertyId?: number;
    maintenanceId?: number;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(options?.propertyId ? { propertyId: options.propertyId } : {}),
      ...(options?.maintenanceId
        ? { maintenanceId: options.maintenanceId }
        : {}),
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expenseDate: "desc" },
        include: {
          property: true,
          maintenance: true,
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      data: expenses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        property: true,
        maintenance: true,
      },
    });

    if (!expense) {
      throw new AppError(404, `Expense dengan ID ${id} tidak ditemukan`);
    }

    return expense;
  }

  async create(input: CreateExpenseInput) {
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
    });

    if (!property) {
      throw new AppError(
        400,
        `Property dengan ID ${input.propertyId} tidak ditemukan`
      );
    }

    if (input.maintenanceId) {
      const maintenance = await prisma.maintenance.findUnique({
        where: { id: input.maintenanceId },
      });

      if (!maintenance) {
        throw new AppError(
          400,
          `Maintenance dengan ID ${input.maintenanceId} tidak ditemukan`
        );
      }
    }

    const expense = await prisma.expense.create({
      data: {
        propertyId: input.propertyId,
        maintenanceId: input.maintenanceId,
        category: input.category,
        amount: input.amount,
        expenseDate: new Date(input.expenseDate),
      },
    });

    return expense;
  }

  async update(id: number, input: UpdateExpenseInput) {
    await this.getById(id); // pastikan exists

    if (input.maintenanceId) {
      const maintenance = await prisma.maintenance.findUnique({
        where: { id: input.maintenanceId },
      });

      if (!maintenance) {
        throw new AppError(
          400,
          `Maintenance dengan ID ${input.maintenanceId} tidak ditemukan`
        );
      }
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        category: input.category,
        amount: input.amount,
        expenseDate: input.expenseDate ? new Date(input.expenseDate) : undefined,
        maintenanceId:
          input.maintenanceId === null ? null : input.maintenanceId,
      },
    });

    return updated;
  }

  async delete(id: number) {
    await this.getById(id); // pastikan exists

    await prisma.expense.delete({ where: { id } });

    return { message: "Expense berhasil dihapus" };
  }
}
