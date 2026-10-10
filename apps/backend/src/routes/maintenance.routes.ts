import { Router } from "express";
import { maintenanceController } from "../controllers/maintenance.controller";
import { validateRequest } from "../middleware/validateRequest.middleware";
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  getMaintenanceSchema,
  listMaintenancesSchema,
} from "../validators/maintenance.validator";

const router = Router();

router.get(
  "/",
  validateRequest(listMaintenancesSchema),
  maintenanceController.getAll
);

router.get(
  "/:id",
  validateRequest(getMaintenanceSchema),
  maintenanceController.getById
);

router.post(
  "/",
  validateRequest(createMaintenanceSchema),
  maintenanceController.create
);

router.put(
  "/:id",
  validateRequest(updateMaintenanceSchema),
  maintenanceController.update
);

router.delete(
  "/:id",
  validateRequest(getMaintenanceSchema),
  maintenanceController.delete
);

export default router;
