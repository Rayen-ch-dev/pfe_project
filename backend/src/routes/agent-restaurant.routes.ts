import { Router } from "express";
import { scanStudentQR } from "../controllers/agent-restaurant.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// All agent-restaurant routes require authentication
router.use(authMiddleware);

// Scan student QR code
// GET /api/agent-restaurant/scan/:userId
router.get("/scan/:userId", scanStudentQR);

export default router;
