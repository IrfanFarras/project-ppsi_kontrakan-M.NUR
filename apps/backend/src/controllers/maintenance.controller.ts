import { Request, Response } from "express";
import { MaintenanceService } from "../services/maintenance.service";
import { asyncHandler } from "../utils/asyncHandler";

const maintenanceService = new MaintenanceService();

export const maintenanceController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { propertyId, status, page, limit } = req.query;

    const result = await maintenanceService.getAll({
      propertyId: propertyId as any,
      status: status as any,
      page: page as any,
      limit: limit as any,
    });

    res.json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const maintenance = await maintenanceService.getById(id);
    res.json(maintenance);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const maintenance = await maintenanceService.create(req.body);
    res.status(201).json(maintenance);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const maintenance = await maintenanceService.update(id, req.body);
    res.json(maintenance);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const result = await maintenanceService.delete(id);
    res.json(result);
  }),
};
