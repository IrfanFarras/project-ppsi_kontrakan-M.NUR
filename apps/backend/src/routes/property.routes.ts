import { Router } from "express";
import { propertyController } from "../controllers/property.controller";
import { validateRequest } from "../middleware/validateRequest.middleware";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createPropertySchema,
  updatePropertySchema,
  getPropertySchema,
  listPropertiesSchema,
} from "../validators/property.validator";

const router = Router();

router.get(
  "/",
  validateRequest(listPropertiesSchema),
  propertyController.getAll
);

router.get(
  "/:id",
  validateRequest(getPropertySchema),
  propertyController.getById
);

router.post(
  "/",
  authenticate,
  authorize("OWNER"),
  validateRequest(createPropertySchema),
  propertyController.create
);

router.put(
  "/:id",
  authenticate,
  authorize("OWNER"),
  validateRequest(updatePropertySchema),
  propertyController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize("OWNER"),
  validateRequest(getPropertySchema),
  propertyController.delete
);

export default router;
