import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

/** Calendar day in local time (same interpretation as existing toDateString() checks). */
function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Lunch for calendar day D: reservable from D-1 at 19:00 until D at 8:30 (local time).
 */
function isWithinLunchReservationWindow(now: Date, mealDay: Date): boolean {
  const dayStart = startOfLocalDay(mealDay);
  const windowEnd = new Date(dayStart);
  windowEnd.setHours(8, 30, 0, 0);
  const windowStart = new Date(dayStart);
  windowStart.setDate(windowStart.getDate() - 1);
  windowStart.setHours(19, 0, 0, 0);
  const t = now.getTime();
  return t >= windowStart.getTime() && t < windowEnd.getTime();
}

/**
 * Dinner for calendar day D: reservable from D-1 at 19:00 until D at 14:00 (local time).
 */
function isWithinDinnerReservationWindow(now: Date, mealDay: Date): boolean {
  const dayStart = startOfLocalDay(mealDay);
  const windowEnd = new Date(dayStart);
  windowEnd.setHours(14, 0, 0, 0);
  const windowStart = new Date(dayStart);
  windowStart.setDate(windowStart.getDate() - 1);
  windowStart.setHours(19, 0, 0, 0);
  const t = now.getTime();
  return t >= windowStart.getTime() && t < windowEnd.getTime();
}

const LUNCH_RESERVATION_WINDOW_MESSAGE =
  "Les réservations pour le déjeuner sont ouvertes de 19h00 la veille jusqu'à 8h30 le jour du repas.";

const DINNER_RESERVATION_WINDOW_MESSAGE =
  "Les réservations pour le dîner sont ouvertes de 19h00 la veille jusqu'à 14h le jour du repas.";

export const getMonthlyMealsCount = async (req: AuthRequest, res: Response) => {
  try {
    // Current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 🔍 Fetch reservations for current month
    const reservations = await prisma.reservation.findMany({
      where: {
        userId: req.user?.id as string,
        meal: {
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      },
      include: {
        meal: true,
      },
    });

    const mealsCount = reservations.length;
    
    res.json({ 
      mealsCount,
      month: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    });
  } catch (error: any) {
    console.error('Error getting monthly meals count:', error);
    res.status(500).json({ message: 'Failed to get monthly meals count' });
  }
};

export const getTodayMealsCount = async (req: AuthRequest, res: Response) => {
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
        userId: req.user?.id as string,
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
    const { mealType, date, forMealType } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Mobile uses CHECK to count same-day reservations before creating (not a Prisma MealType)
    if (mealType === "CHECK") {
      const target =
        forMealType === "LUNCH" || forMealType === "DINNER" ? forMealType : "DINNER";
      const checkDate = date ? new Date(date) : new Date();
      const dayStart = startOfLocalDay(checkDate);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const existingReservations = await prisma.reservation.count({
        where: {
          userId: userId as string,
          status: { not: "CANCELLED" },
          meal: {
            type: target,
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        },
      });

      return res.status(200).json({
        message: "CHECK",
        existingReservations,
      });
    }

    const now = new Date();
    const reservationDate = date ? new Date(date) : new Date();

    const isToday = reservationDate.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = reservationDate.toDateString() === tomorrow.toDateString();
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const isDayAfterTomorrow = reservationDate.toDateString() === dayAfterTomorrow.toDateString();

    if (mealType === 'LUNCH') {
      if (!isToday && !isTomorrow && !isDayAfterTomorrow) {
        return res.status(400).json({
          message: "Vous pouvez seulement réserver pour aujourd'hui, demain, ou après-demain.",
        });
      }
      if (!isWithinLunchReservationWindow(now, reservationDate)) {
        return res.status(400).json({ message: LUNCH_RESERVATION_WINDOW_MESSAGE });
      }
    }

    if (mealType === 'DINNER') {
      if (!isToday && !isTomorrow && !isDayAfterTomorrow) {
        return res.status(400).json({
          message: "Vous pouvez seulement réserver pour aujourd'hui, demain, ou après-demain.",
        });
      }
      if (!isWithinDinnerReservationWindow(now, reservationDate)) {
        return res.status(400).json({ message: DINNER_RESERVATION_WINDOW_MESSAGE });
      }
    }

    // Check if user has available tickets
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate user's available tickets
    const userPayments = await prisma.payment.findMany({
      where: {
        userId: req.user?.id as string,
        status: "PAID",
      },
    });

    const totalTickets = userPayments.reduce((total, payment) => total + Math.round(payment.amount / 0.2), 0);

    const usedTickets = await prisma.reservation.count({
      where: {
        userId: req.user?.id as string,
        status: "USED",
      },
    });

    const confirmedTickets = await prisma.reservation.count({
      where: {
        userId: req.user?.id as string,
        status: "CONFIRMED",
      },
    });

    const availableTickets = totalTickets - usedTickets - confirmedTickets;

    if (availableTickets <= 0) {
      return res.status(400).json({ 
        message: "No tickets available. Please purchase a package to get more tickets.",
        totalTickets,
        usedTickets,
        availableTickets
      });
    }

    // Create or find meal for the specific date and time
    const mealDate = date ? new Date(date) : new Date();

    let meal = await prisma.meal.findFirst({
      where: {
        date: mealDate,
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

    const dayStart = startOfLocalDay(mealDate);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const mt = mealType || "DINNER";

    const reservationsSameDayType = await prisma.reservation.count({
      where: {
        userId: userId as string,
        status: { not: "CANCELLED" },
        meal: {
          type: mt,
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      },
    });

    if (reservationsSameDayType >= 2) {
      return res.status(400).json({
        message:
          "Limite atteinte : 2 réservations maximum par jour pour ce type de repas (déjeuner ou dîner).",
      });
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        userId: req.user?.id as string,
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

export const scanReservationPreview = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // 🕒 Today range
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const reservations = await prisma.reservation.findMany({
      where: {
        userId: req.user?.id as string,
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