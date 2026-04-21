import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getTodayMealsCount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Today range
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

export const createReservation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { mealType, date } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has available tickets
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create or find today's meal
    const mealDate = date ? new Date(date) : new Date();
    mealDate.setHours(12, 0, 0, 0); // Set to noon

    let meal = await prisma.meal.findFirst({
      where: {
        date: {
          gte: new Date(mealDate.setHours(0, 0, 0, 0)),
          lte: new Date(mealDate.setHours(23, 59, 59, 999)),
        },
        type: mealType || 'DINNER',
      },
    });

    if (!meal) {
      meal = await prisma.meal.create({
        data: {
          date: mealDate,
          type: mealType || 'DINNER',
        },
      });
    }

    // Check if reservation already exists
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        userId,
        mealId: meal.id,
      },
    });

    if (existingReservation) {
      return res.status(400).json({ message: "Reservation already exists for this meal" });
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        mealId: meal.id,
        date: mealDate,
        status: "CONFIRMED",
      },
      include: {
        meal: true,
      },
    });

    res.json({
      message: "✅ Reservation created successfully",
      reservation: {
        id: reservation.id,
        mealType: reservation.meal?.type || 'DINNER',
        date: reservation.meal?.date || mealDate,
        status: reservation.status,
      },
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ message: "Server error", error });
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
        firstName: reservations[0]?.user?.firstName || '',
        lastName: reservations[0]?.user?.lastName || '',
      },
      total,
      used,
      remaining,
      meals: reservations.map(r => ({
        type: r.meal?.type || 'UNKNOWN',
        status: r.status,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};