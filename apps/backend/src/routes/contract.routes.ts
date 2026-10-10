import { Router } from "express";
import { contractController } from "../controllers/contract.controller";
import { validateRequest } from "../middleware/validateRequest.middleware";
import {
  createContractSchema,
  updateContractSchema,
  getContractSchema,
  listContractsSchema,
} from "../validators/contract.validator";

const router = Router();

router.get(
  "/",
  validateRequest(listContractsSchema),
  contractController.getAll
);

router.get(
  "/:id",
  validateRequest(getContractSchema),
  contractController.getById
);

router.post(
  "/",
  validateRequest(createContractSchema),
  contractController.create
);

router.put(
  "/:id",
  validateRequest(updateContractSchema),
  contractController.update
);

router.delete(
  "/:id",
  validateRequest(getContractSchema),
  contractController.delete
);

export default router;
