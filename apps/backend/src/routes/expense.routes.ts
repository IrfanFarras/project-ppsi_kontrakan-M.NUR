import { Router } from "express";
import { expenseController } from "../controllers/expense.controller";
import { validateRequest } from "../middleware/validateRequest.middleware";
import {
  createExpenseSchema,
  updateExpenseSchema,
  getExpenseSchema,
  listExpensesSchema,
} from "../validators/expense.validator";

const router = Router();

router.get(
  "/",
  validateRequest(listExpensesSchema),
  expenseController.getAll
);

router.get(
  "/:id",
  validateRequest(getExpenseSchema),
  expenseController.getById
);

router.post(
  "/",
  validateRequest(createExpenseSchema),
  expenseController.create
);

router.put(
  "/:id",
  validateRequest(updateExpenseSchema),
  expenseController.update
);

router.delete(
  "/:id",
  validateRequest(getExpenseSchema),
  expenseController.delete
);

export default router;
