import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};