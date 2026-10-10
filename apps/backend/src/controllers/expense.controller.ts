import { Request, Response } from "express";
import { ExpenseService } from "../services/expense.service";
import { asyncHandler } from "../utils/asyncHandler";

const expenseService = new ExpenseService();

export const expenseController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { propertyId, maintenanceId, page, limit } = req.query;

    const result = await expenseService.getAll({
      propertyId: propertyId as any,
      maintenanceId: maintenanceId as any,
      page: page as any,
      limit: limit as any,
    });

    res.json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const expense = await expenseService.getById(id);
    res.json(expense);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const expense = await expenseService.create(req.body);
    res.status(201).json(expense);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const expense = await expenseService.update(id, req.body);
    res.json(expense);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const result = await expenseService.delete(id);
    res.json(result);
  }),
};
