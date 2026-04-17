import { Router } from "express";
import * as auth from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

// Public routes
router.post("/register", auth.register);
router.post("/login", auth.login);

// Admin-only routes
router.post("/admin/register", authMiddleware, adminMiddleware, auth.registerAdmin);
router.post("/admin/register-agent", authMiddleware, adminMiddleware, auth.registerAgentRestaurant);

export default router;