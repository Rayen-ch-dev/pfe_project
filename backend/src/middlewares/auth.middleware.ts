import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check for token in Authorization header (for mobile app) or cookies (for web)
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;
  
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : cookieToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    // Check if user still exists and has approved status
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, status: true }
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check approval status for non-admin users
    if (user.role !== "ADMIN" && user.status !== "APPROVED") {
      return res.status(403).json({ message: "Account not approved by admin" });
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Payment auth middleware - allows pending students to make purchases
export const paymentAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check for token in Authorization header (for mobile app) or cookies (for web)
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;
  
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : cookieToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, status: true }
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // For payment operations, allow:
    // - Admin users (any status)
    // - Students with APPROVED status
    // - Students with PENDING status (to allow office payment)
    if (user.role === "ADMIN" || 
        (user.role === "STUDENT" && (user.status === "APPROVED" || user.status === "PENDING"))) {
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({ message: "Account not approved for payments" });
    }
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Re-export admin middleware for convenience
export { adminMiddleware } from './admin.middleware';