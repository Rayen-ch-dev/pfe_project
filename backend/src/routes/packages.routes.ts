import { Router } from "express";
import { getPackages } from "../controllers/packages.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * AUTH USER - Get available packages
 */
router.get("/", authMiddleware, getPackages);

export default router;
