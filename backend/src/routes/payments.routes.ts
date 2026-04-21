import { Router } from "express";
import { purchasePackage, purchaseCustomTickets } from "../controllers/payments.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * AUTH USER - Purchase operations
 */
router.post("/purchase", authMiddleware, purchasePackage);
router.post("/custom", authMiddleware, purchaseCustomTickets);

export default router;
