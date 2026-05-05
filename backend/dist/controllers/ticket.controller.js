"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTicket = exports.getUserRealTickets = void 0;
const prisma_1 = require("../lib/prisma");
const getUserRealTickets = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        // Get all user's payments
        const payments = await prisma_1.prisma.payment.findMany({
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
            totalTickets += Math.round(payment.amount / 0.2);
        });
        // Get used tickets from reservations
        const usedReservations = await prisma_1.prisma.reservation.count({
            where: {
                userId,
                status: "USED",
            },
        });
        // Get confirmed reservations (upcoming meals)
        const confirmedReservations = await prisma_1.prisma.reservation.count({
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
    }
    catch (error) {
        console.error("Error fetching user tickets:", error);
        res.status(500).json({ error: "Failed to fetch user tickets" });
    }
};
exports.getUserRealTickets = getUserRealTickets;
const useTicket = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { reservationId } = req.body;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        // Find the reservation
        const reservation = await prisma_1.prisma.reservation.findFirst({
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
        const updatedReservation = await prisma_1.prisma.reservation.update({
            where: { id: reservationId },
            data: { status: "USED" },
        });
        res.json({
            message: "✅ Ticket used successfully",
            reservation: updatedReservation,
        });
    }
    catch (error) {
        console.error("Error using ticket:", error);
        res.status(500).json({ error: "Failed to use ticket" });
    }
};
exports.useTicket = useTicket;
//# sourceMappingURL=ticket.controller.js.map