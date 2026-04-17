import { Router } from "express";
import {
  getTodayMealsCount,
  scanReservationPreview,
} from "../controllers/reservation.controller";

import { authMiddleware } from "../middlewares/auth.middleware";
import { agentRestaurantMiddleware } from "../middlewares/agentRestaurant.middleware";

const router = Router();

// 👁 Get meals count for today
router.get(
  "/today/:userId",
  authMiddleware,
  agentRestaurantMiddleware,
  getTodayMealsCount
);

// 👁 Scan QR (preview only, no DB update)
router.get(
  "/scan/:userId",
  authMiddleware,
  agentRestaurantMiddleware,
  scanReservationPreview
);

export default router;