import { Router } from "express";
import healthRoutes from "./health.routes";
import propertyRoutes from "./property.routes";
import tenantRoutes from "./tenant.routes";
import contractRoutes from "./contract.routes";
import paymentRoutes from "./payment.routes";
import maintenanceRoutes from "./maintenance.routes";
import expenseRoutes from "./expense.routes";
import parkingRoutes from "./parking.routes";
import reportRoutes from "./report.routes";
import orderRoutes from "./order.routes";
import authRoutes from "./auth.routes";
import { authenticate, authorize } from "../middleware/auth.middleware";

/**
 * Root API router
 *
 * Otorisasi (Auth Phase A.3):
 * - /health, /auth        : publik
 * - /properties           : GET publik, POST/PUT/DELETE OWNER (lihat property.routes.ts)
 * - /orders               : diatur per-route (lihat order.routes.ts)
 * - sisanya               : seluruh route hanya untuk OWNER
 */
const router = Router();
const ownerOnly = [authenticate, authorize("OWNER")];

router.use("/health", healthRoutes);
router.use("/properties", propertyRoutes);
router.use("/tenants", ...ownerOnly, tenantRoutes);
router.use("/contracts", ...ownerOnly, contractRoutes);
router.use("/payments", ...ownerOnly, paymentRoutes);
router.use("/maintenances", ...ownerOnly, maintenanceRoutes);
router.use("/expenses", ...ownerOnly, expenseRoutes);
router.use("/parkings", ...ownerOnly, parkingRoutes);
router.use("/reports", ...ownerOnly, reportRoutes);
router.use("/orders", orderRoutes);
router.use("/auth", authRoutes);

export default router;
