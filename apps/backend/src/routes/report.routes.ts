import { Router } from "express";
import { reportController } from "../controllers/report.controller";

const router = Router();

// GET /api/reports/monthly?year=2026&month=9
router.get("/monthly", reportController.getMonthlyReport);

export default router;
