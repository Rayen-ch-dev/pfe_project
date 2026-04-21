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
    const package_ = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!package_) {
      return res.status(404).json({ error: "Package not found" });
    }

    // Update user's package
    const updatedUser = await prisma.user.update({
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

    // Create payment record
    await prisma.payment.create({
      data: {
        userId,
        amount: package_.price,
        status: "PAID",
      },
    });

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

    // Create payment record
    await prisma.payment.create({
      data: {
        userId,
        amount: price,
        status: "PAID",
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
