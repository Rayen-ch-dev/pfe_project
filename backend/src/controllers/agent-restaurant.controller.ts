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

    // Find the student by ID with their reservations and payments
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        reservations: true,
        payments: true,
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.role !== "STUDENT") {
      return res.status(400).json({ message: "QR code is not for a student" });
    }

    // Calculate meal information based on reservations and payments
    const totalReservations = student.reservations.length;
    const usedReservations = student.reservations.filter(r => r.status === "USED").length;
    const paidMeals = student.payments.filter(p => p.status === "PAID").length;
    
    // For simplicity, we'll consider paid meals as total meals and used reservations as used meals
    const totalMeals = paidMeals;
    const usedMeals = usedReservations;
    const remainingMeals = totalMeals - usedMeals;

    // Log the scan for tracking (optional)
    console.log(`Agent ${agentId} scanned student ${userId}`);

    res.json({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      totalMeals,
      usedMeals,
      remainingMeals,
    });
  } catch (error: any) {
    console.error("Scan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
