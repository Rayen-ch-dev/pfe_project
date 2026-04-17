import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const agentRestaurantMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "AGENT_RESTAURANT") {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};