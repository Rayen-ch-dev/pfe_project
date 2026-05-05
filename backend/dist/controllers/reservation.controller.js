"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanReservationPreview = exports.createReservation = exports.getTodayMealsCount = void 0;
const prisma_1 = require("../lib/prisma");
const getTodayMealsCount = async (req, res) => {
    try {
        const { userId } = req.params;
        // Today range
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        // 🔍 Fetch reservations for today
        const reservations = await prisma_1.prisma.reservation.findMany({
            where: {
                userId: req.user?.id,
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
    }
    catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.getTodayMealsCount = getTodayMealsCount;
const createReservation = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { mealType, date } = req.body;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Time-based reservation restrictions for students
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const reservationDate = date ? new Date(date) : new Date();
        // Time windows in minutes from midnight
        const DINNER_START_TIME = 8 * 60 + 30; // 8:30 AM = 510 minutes
        const LUNCH_START_TIME = 14 * 60; // 2:00 PM = 840 minutes  
        const END_TIME = 19 * 60; // 7:00 PM = 1140 minutes
        // Check if reservation is for today
        const isToday = reservationDate.toDateString() === now.toDateString();
        // Check if reservation is for tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = reservationDate.toDateString() === tomorrow.toDateString();
        // Check if reservation is for day after tomorrow
        const dayAfterTomorrow = new Date(now);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        const isDayAfterTomorrow = reservationDate.toDateString() === dayAfterTomorrow.toDateString();
        if (mealType === 'LUNCH') {
            // Today's lunch: 8:30 AM - 11:30 AM
            if (isToday && (currentTimeInMinutes < (8 * 60 + 30) || currentTimeInMinutes >= (11 * 60 + 30))) {
                return res.status(400).json({
                    message: "La réservation pour le déjeuner d'aujourd'hui est possible de 8h30 à 11h30."
                });
            }
            // Tomorrow's lunch: 2:00 PM - 7:00 PM (can reserve after lunch time today)
            if (isTomorrow && currentTimeInMinutes < LUNCH_START_TIME) {
                return res.status(400).json({
                    message: "La réservation pour le déjeuner de demain est possible à partir de 14h."
                });
            }
            // Only allow today, tomorrow, or day after tomorrow
            if (!isToday && !isTomorrow && !isDayAfterTomorrow) {
                return res.status(400).json({
                    message: "Vous pouvez seulement réserver pour aujourd'hui, demain, ou après-demain."
                });
            }
        }
        if (mealType === 'DINNER') {
            // Today's dinner: 8:30 AM - 7:00 PM
            if (isToday && (currentTimeInMinutes < DINNER_START_TIME || currentTimeInMinutes >= END_TIME)) {
                return res.status(400).json({
                    message: "La réservation pour le dîner d'aujourd'hui est possible de 8h30 à 19h."
                });
            }
            // Tomorrow's dinner: 8:30 AM - 7:00 PM (can reserve anytime today)
            if (isTomorrow && currentTimeInMinutes < DINNER_START_TIME) {
                return res.status(400).json({
                    message: "La réservation pour le dîner de demain est possible à partir de 8h30."
                });
            }
            // Only allow today, tomorrow, or day after tomorrow
            if (!isToday && !isTomorrow && !isDayAfterTomorrow) {
                return res.status(400).json({
                    message: "Vous pouvez seulement réserver pour aujourd'hui, demain, ou après-demain."
                });
            }
        }
        // Check if user has available tickets
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Calculate user's available tickets
        const userPayments = await prisma_1.prisma.payment.findMany({
            where: {
                userId: req.user?.id,
                status: "PAID",
            },
        });
        const totalTickets = userPayments.reduce((total, payment) => total + Math.round(payment.amount / 0.2), 0);
        const usedTickets = await prisma_1.prisma.reservation.count({
            where: {
                userId: req.user?.id,
                status: "USED",
            },
        });
        const confirmedTickets = await prisma_1.prisma.reservation.count({
            where: {
                userId: req.user?.id,
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
        let meal = await prisma_1.prisma.meal.findFirst({
            where: {
                date: mealDate,
                type: mealType || 'DINNER',
            },
        });
        if (!meal) {
            meal = await prisma_1.prisma.meal.create({
                data: {
                    date: mealDate,
                    type: mealType || 'DINNER',
                },
            });
        }
        // Check if reservation already exists
        const existingReservation = await prisma_1.prisma.reservation.findFirst({
            where: {
                userId: req.user?.id,
                mealId: meal.id,
            },
        });
        if (existingReservation) {
            return res.status(400).json({ message: "Reservation already exists for this meal" });
        }
        // Create reservation
        const reservation = await prisma_1.prisma.reservation.create({
            data: {
                userId: req.user?.id,
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
    }
    catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
exports.createReservation = createReservation;
const scanReservationPreview = async (req, res) => {
    try {
        const { userId } = req.params;
        // 🕒 Today range
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const reservations = await prisma_1.prisma.reservation.findMany({
            where: {
                userId: req.user?.id,
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
    }
    catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
};
exports.scanReservationPreview = scanReservationPreview;
//# sourceMappingURL=reservation.controller.js.map