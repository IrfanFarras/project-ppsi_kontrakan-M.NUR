import { Request, Response } from "express";
import { ParkingService } from "../services/parking.service";
import { asyncHandler } from "../utils/asyncHandler";

const parkingService = new ParkingService();

export const parkingController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { propertyId, tenantId, page, limit } = req.query;

    const result = await parkingService.getAll({
      propertyId: propertyId as any,
      tenantId: tenantId as any,
      page: page as any,
      limit: limit as any,
    });

    res.json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const parking = await parkingService.getById(id);
    res.json(parking);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const parking = await parkingService.create(req.body);
    res.status(201).json(parking);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const parking = await parkingService.update(id, req.body);
    res.json(parking);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const result = await parkingService.delete(id);
    res.json(result);
  }),
};
