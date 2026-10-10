import { Request, Response } from "express";
import { PropertyService } from "../services/property.service";
import { asyncHandler } from "../utils/asyncHandler";

const propertyService = new PropertyService();

export const propertyController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { status, page, limit } = req.query;

    const result = await propertyService.getAll({
      status: status as any,
      page: page as any,
      limit: limit as any,
    });

    res.json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const property = await propertyService.getById(id);
    res.json(property);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const property = await propertyService.create(req.body);
    res.status(201).json(property);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const property = await propertyService.update(id, req.body);
    res.json(property);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const result = await propertyService.delete(id);
    res.json(result);
  }),
};
