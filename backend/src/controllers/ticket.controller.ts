import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getUserRealTickets = async (req: Request, res: Response) => {
  try {
    // For testing, use a hardcoded user ID
    const userId = "e8601548-17eb-4df9-981d-10e9c6dc861b"; // Your user ID from the token

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get all user's payments
    const payments = await prisma.payment.findMany({
      where: {
        userId,
        status: "PAID",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate total tickets from payments (simple calculation)
    let totalTickets = 0;
    payments.forEach(payment => {
      // Assume 1 DT = 5 tickets (0.2 DT per ticket)
      totalTickets += Math.floor(payment.amount / 0.2);
    });

    // Get used tickets from reservations
    const usedReservations = await prisma.reservation.count({
      where: {
        userId,
        status: "USED",
      },
    });

    // Get confirmed reservations (upcoming meals)
    const confirmedReservations = await prisma.reservation.count({
      where: {
        userId,
        status: "CONFIRMED",
      },
    });

    const remainingTickets = totalTickets - usedReservations;

    res.json({
      totalTickets,
      usedTickets: usedReservations,
      remainingTickets,
      confirmedReservations,
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        ticketsAdded: Math.floor(p.amount / 0.2),
        date: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    res.status(500).json({ error: "Failed to fetch user tickets" });
  }
};

export const useTicket = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { reservationId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Find the reservation
    const reservation = await prisma.reservation.findFirst({
      where: {
        id: reservationId,
        userId,
        status: "CONFIRMED",
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    // Mark as used
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: "USED" },
    });

    res.json({
      message: "✅ Ticket used successfully",
      reservation: updatedReservation,
    });
  } catch (error) {
    console.error("Error using ticket:", error);
    res.status(500).json({ error: "Failed to use ticket" });
  }
};
