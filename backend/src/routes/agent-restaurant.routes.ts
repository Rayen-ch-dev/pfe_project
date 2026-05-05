import { Router } from "express";
import { scanStudentQR, validateMeal } from "../controllers/agent-restaurant.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// All agent-restaurant routes require authentication
router.use(authMiddleware);

// Scan student QR code
// GET /api/agent-restaurant/scan/:userId
router.get("/scan/:userId", scanStudentQR);

// Validate meal
// POST /api/agent-restaurant/validate-meal
router.post("/validate-meal", validateMeal);

export default router;
