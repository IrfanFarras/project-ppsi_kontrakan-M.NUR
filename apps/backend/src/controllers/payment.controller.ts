import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { asyncHandler } from "../utils/asyncHandler";

const paymentService = new PaymentService();

export const paymentController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { contractId, status, page, limit } = req.query;

    const result = await paymentService.getAll({
      contractId: contractId as any,
      status: status as any,
      page: page as any,
      limit: limit as any,
    });

    res.json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const payment = await paymentService.getById(id);
    res.json(payment);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const payment = await paymentService.create(req.body);
    res.status(201).json(payment);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const payment = await paymentService.update(id, req.body);
    res.json(payment);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const result = await paymentService.delete(id);
    res.json(result);
  }),
};
