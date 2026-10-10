import { Router } from "express";
import { tenantController } from "../controllers/tenant.controller";
import { validateRequest } from "../middleware/validateRequest.middleware";
import {
  createTenantSchema,
  updateTenantSchema,
  getTenantSchema,
  listTenantsSchema,
} from "../validators/tenant.validator";

const router = Router();

router.get("/", validateRequest(listTenantsSchema), tenantController.getAll);

router.get("/:id", validateRequest(getTenantSchema), tenantController.getById);

router.post("/", validateRequest(createTenantSchema), tenantController.create);

router.put(
  "/:id",
  validateRequest(updateTenantSchema),
  tenantController.update
);

router.delete(
  "/:id",
  validateRequest(getTenantSchema),
  tenantController.delete
);

export default router;
