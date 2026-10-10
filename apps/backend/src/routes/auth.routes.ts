import { Router } from "express";
import { AuthService } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validateRequest.middleware";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { AppError } from "../utils/AppError";

const router = Router();
const authService = new AuthService();

router.post("/register", validateRequest(registerSchema), asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ data: result });
}));

router.post("/login", validateRequest(loginSchema), asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ data: result });
}));

router.get("/me", authenticate, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }
  const user = await authService.getMe(req.user.userId);
  res.json({ data: user });
}));

export default router;

