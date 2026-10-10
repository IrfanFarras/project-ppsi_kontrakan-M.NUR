import { Request, Response } from "express";
import { ContractService } from "../services/contract.service";
import { asyncHandler } from "../utils/asyncHandler";

const contractService = new ContractService();

export const contractController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { propertyId, tenantId, status, page, limit } = req.query;

    const result = await contractService.getAll({
      propertyId: propertyId as any,
      tenantId: tenantId as any,
      status: status as any,
      page: page as any,
      limit: limit as any,
    });

    res.json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const contract = await contractService.getById(id);
    res.json(contract);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const contract = await contractService.create(req.body);
    res.status(201).json(contract);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const contract = await contractService.update(id, req.body);
    res.json(contract);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const result = await contractService.delete(id);
    res.json(result);
  }),
};
