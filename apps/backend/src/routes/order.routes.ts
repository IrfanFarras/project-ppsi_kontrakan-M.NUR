import { Router } from "express";
import { OrderService } from "../services/order.service";
import { validateRequest } from "../middleware/validateRequest.middleware";
import { createOrderSchema, updateOrderStatusSchema, getOrderSchema } from "../validators/order.validator";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();
const orderService = new OrderService();

/**
 * Otorisasi order (Auth Phase A.2):
 * - POST /            : PUBLIK (calon penyewa mengajukan order tanpa login)
 * - GET /, GET /:id   : hanya OWNER
 * - PATCH /:id/status : hanya OWNER (approve / reject / cancel)
 */
router.get("/", authenticate, authorize("OWNER"), asyncHandler(async (_req, res) => {
  const orders = await orderService.getAll();
  res.json({ data: orders });
}));

router.get("/:id", authenticate, authorize("OWNER"), validateRequest(getOrderSchema), asyncHandler(async (req, res) => {
  const order = await orderService.getById(parseInt(req.params.id));
  res.json({ data: order });
}));

router.post("/", validateRequest(createOrderSchema), asyncHandler(async (req, res) => {
  const order = await orderService.create(req.body);
  res.status(201).json({ data: order });
}));

router.patch("/:id/status", authenticate, authorize("OWNER"), validateRequest(updateOrderStatusSchema), asyncHandler(async (req, res) => {
  const { status, rejectionReason, identityNumber } = req.body;
  const order = await orderService.updateStatus(parseInt(req.params.id), status, rejectionReason, identityNumber);
  res.json({ data: order });
}));

export default router;
