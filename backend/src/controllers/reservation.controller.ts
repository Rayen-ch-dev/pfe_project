import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getTodayMealsCount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // 🕒 Today range
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // 🔍 Fetch reservations for today
    const reservations = await prisma.reservation.findMany({
      where: {
        userId,
        meal: {
          date: {
            gte: start,
            lte: end,
          },
        },
      },
      include: {
        meal: true,
      },
    });

    // 🧮 Calculate stats
    const total = reservations.length;
    const used = reservations.filter(r => r.status === "USED").length;
    const remaining = reservations.filter(r => r.status === "CONFIRMED").length;

    return res.json({
      total,
      used,
      remaining,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
export const scanReservationPreview = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // 🕒 Today range
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const reservations = await prisma.reservation.findMany({
      where: {
        userId,
        meal: {
          date: {
            gte: start,
            lte: end,
          },
        },
      },
      include: {
        meal: true,
        user: true,
      },
    });

    if (reservations.length === 0) {
      return res.json({
        message: "❌ No meals for today",
        total: 0,
        used: 0,
        remaining: 0,
      });
    }

    const total = reservations.length;
    const used = reservations.filter(r => r.status === "USED").length;
    const remaining = reservations.filter(r => r.status === "CONFIRMED").length;

    return res.json({
      message: "✅ Meals found",
      user: {
        firstName: reservations[0].user.firstName,
        lastName: reservations[0].user.lastName,
      },
      total,
      used,
      remaining,
      meals: reservations.map(r => ({
        type: r.meal.type,
        status: r.status,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};