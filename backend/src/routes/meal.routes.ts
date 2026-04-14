import { Router } from "express";
import { getTodayMeal } from "../controllers/meal.controller";

const router = Router();

// GET /api/meal/today/:userId
router.get("/today/:userId", getTodayMeal);

export default router;