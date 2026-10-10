import { Router } from "express";
import { parkingController } from "../controllers/parking.controller";
import { validateRequest } from "../middleware/validateRequest.middleware";
import {
  createParkingSchema,
  updateParkingSchema,
  getParkingSchema,
  listParkingsSchema,
} from "../validators/parking.validator";

const router = Router();

router.get(
  "/",
  validateRequest(listParkingsSchema),
  parkingController.getAll
);

router.get(
  "/:id",
  validateRequest(getParkingSchema),
  parkingController.getById
);

router.post(
  "/",
  validateRequest(createParkingSchema),
  parkingController.create
);

router.put(
  "/:id",
  validateRequest(updateParkingSchema),
  parkingController.update
);

router.delete(
  "/:id",
  validateRequest(getParkingSchema),
  parkingController.delete
);

export default router;
