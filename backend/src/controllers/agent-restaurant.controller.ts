import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { prisma } from "../lib/prisma";

export const scanStudentQR = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const agentId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find the student by ID with their reservations and meals
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        reservations: {
          include: {
            meal: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.role !== "STUDENT") {
      return res.status(400).json({ message: "QR code is not for a student" });
    }

    // Get today's date (start and end)
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Filter reservations for today
    const todayReservations = student.reservations.filter(reservation => {
      const reservationDate = new Date(reservation.date);
      return reservationDate >= todayStart && reservationDate < todayEnd;
    });

    // Format today's reservations
    const formattedReservations = todayReservations.map(reservation => ({
      id: reservation.id,
      date: reservation.date,
      mealType: reservation.meal?.type || 'UNKNOWN',
      status: reservation.status,
      mealDate: reservation.meal?.date,
    }));

    // Log the scan for tracking (optional)
    console.log(`Agent ${agentId} scanned student ${userId}, found ${todayReservations.length} reservations for today`);

    res.json({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      todayReservations: formattedReservations,
      totalReservationsToday: todayReservations.length,
    });
  } catch (error: any) {
    console.error("Scan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// VALIDATE MEAL
export const validateMeal = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, reservationId, mealType } = req.body;
    const agentId = req.user?.id;

    if (!studentId || !reservationId || !mealType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        meal: true,
        user: true
      }
    });

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.userId !== studentId) {
      return res.status(400).json({ message: "Reservation does not belong to this student" });
    }

    if (reservation.status === "USED") {
      return res.status(400).json({ message: "Meal already used" });
    }

    // Update reservation status to USED
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: "USED",
        usedAt: new Date(),
        validatedBy: agentId
      }
    });

    console.log(`Agent ${agentId} validated ${mealType} for student ${studentId}, reservation ${reservationId}`);

    res.json({
      message: "Meal validated successfully",
      reservation: updatedReservation
    });
  } catch (error: any) {
    console.error("Meal validation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
