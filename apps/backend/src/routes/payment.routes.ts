import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { validateRequest } from "../middleware/validateRequest.middleware";
import {
  createPaymentSchema,
  updatePaymentSchema,
  getPaymentSchema,
  listPaymentsSchema,
} from "../validators/payment.validator";

const router = Router();

router.get("/", validateRequest(listPaymentsSchema), paymentController.getAll);

router.get(
  "/:id",
  validateRequest(getPaymentSchema),
  paymentController.getById
);

router.post(
  "/",
  validateRequest(createPaymentSchema),
  paymentController.create
);

router.put(
  "/:id",
  validateRequest(updatePaymentSchema),
  paymentController.update
);

router.delete(
  "/:id",
  validateRequest(getPaymentSchema),
  paymentController.delete
);

export default router;
