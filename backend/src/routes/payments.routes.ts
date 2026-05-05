import { Router } from "express";
import { purchasePackage, purchaseCustomTickets } from "../controllers/payments.controller";
import { paymentAuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * AUTH USER - Purchase operations (allows pending students)
 */
router.post("/purchase", paymentAuthMiddleware, purchasePackage);
router.post("/custom", paymentAuthMiddleware, purchaseCustomTickets);

export default router;
