import { Request, Response } from "express";
import { getTodayMealService } from "../services/meal.service";

export const getTodayMeal = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    if (!userId || Array.isArray(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const result = await getTodayMealService(userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};