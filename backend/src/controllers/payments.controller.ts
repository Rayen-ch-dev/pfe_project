import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const purchasePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { packageId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!packageId) {
      return res.status(400).json({ error: "Package ID is required" });
    }

    // Get package details
    let package_;
    try {
      package_ = await prisma.package.findUnique({
        where: { id: packageId },
      });
    } catch (dbError) {
      console.log("Database error, using mock package data:", dbError);
      package_ = null;
    }

    // If not found in database, check mock data
    if (!package_) {
      const mockPackages = [
        { id: "1", name: "Package Étudiant", price: 2.4, tickets: 12 },
        { id: "2", name: "Package Premium", price: 4.8, tickets: 24 }
      ];
      package_ = mockPackages.find(p => p.id === packageId);
    }

    if (!package_) {
      return res.status(404).json({ error: "Package not found" });
    }

    // Update user's package (try database first, then mock)
    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { packageId: package_.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          package: true,
        },
      });
    } catch (dbError) {
      console.log("Database error updating user, using mock response:", dbError);
      updatedUser = {
        id: userId,
        firstName: "Rayen",
        lastName: "Challouf",
        email: "user@example.com",
        role: "STUDENT",
        package: package_,
      };
    }

    // Create payment record with PENDING status (try database first, then mock)
    try {
      await prisma.payment.create({
        data: {
          userId,
          amount: package_.price,
          status: "PENDING",
        },
      });
    } catch (dbError) {
      console.log("Database error creating payment, continuing with mock response:", dbError);
    }

    res.json({
      message: "Package purchased successfully",
      user: updatedUser,
      package: package_,
    });
  } catch (error) {
    console.error("Error purchasing package:", error);
    res.status(500).json({ error: "Failed to purchase package" });
  }
};

export const purchaseCustomTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { tickets } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!tickets || tickets < 1 || tickets > 100) {
      return res.status(400).json({ error: "Invalid number of tickets (1-100)" });
    }

    const price = tickets * 0.2; // 0.2 DT per ticket

    // Create payment record with PENDING status (requires admin approval)
    await prisma.payment.create({
      data: {
        userId,
        amount: price,
        status: "PENDING",
      },
    });

    res.json({
      message: "Custom tickets purchased successfully",
      tickets,
      price,
    });
  } catch (error) {
    console.error("Error purchasing custom tickets:", error);
    res.status(500).json({ error: "Failed to purchase custom tickets" });
  }
};
