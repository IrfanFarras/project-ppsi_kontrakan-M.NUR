import { Request, Response } from "express";
import { TenantService } from "../services/tenant.service";
import { asyncHandler } from "../utils/asyncHandler";

const tenantService = new TenantService();

export const tenantController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query;

    const result = await tenantService.getAll({
      page: page as any,
      limit: limit as any,
    });

    res.json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const tenant = await tenantService.getById(id);
    res.json(tenant);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const tenant = await tenantService.create(req.body);
    res.status(201).json(tenant);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const tenant = await tenantService.update(id, req.body);
    res.json(tenant);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const result = await tenantService.delete(id);
    res.json(result);
  }),
};
