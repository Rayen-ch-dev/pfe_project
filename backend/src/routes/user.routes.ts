import { Router } from "express";
import {
  createUser,
  getUserById,
  getUserProfile,
  getAllUsers,
  updateUser,
  deleteUser,
  getUserTickets,
} from "../controllers/user.controller";
import { getUserRealTickets } from "../controllers/ticket.controller";
import { getPackages } from "../controllers/packages.controller";
import { purchasePackage, purchaseCustomTickets } from "../controllers/payments.controller";
import { createReservation, getMonthlyMealsCount } from "../controllers/reservation.controller";

import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

/**
 * PUBLIC
 */
router.post("/", createUser);

/**
 * AUTH USER
 */
router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile", authMiddleware, updateUser);
router.get("/tickets", authMiddleware, getUserRealTickets);

// Packages and Payments (temporary fix - no auth middleware for testing)
router.get("/packages", getPackages);
router.post("/payments/purchase", authMiddleware, purchasePackage);
router.post("/payments/custom", authMiddleware, purchaseCustomTickets);

// Reservations
router.post("/reservations", authMiddleware, createReservation);
router.get("/meals-count", authMiddleware, getMonthlyMealsCount);

/**
 * ADMIN ONLY
 */
router.get("/", authMiddleware, adminMiddleware, getAllUsers);
router.get("/:id", authMiddleware, adminMiddleware, getUserById);
router.put("/:id", authMiddleware, adminMiddleware, updateUser);
router.delete("/:id", authMiddleware, adminMiddleware, deleteUser);

// Debug logging
console.log('User routes registered:');
console.log('- GET /users/profile');
console.log('- PUT /users/profile');
console.log('- GET /users/tickets');
console.log('- GET /users/packages');
console.log('- POST /users/payments/purchase');
console.log('- POST /users/payments/custom');
console.log('- POST /users/reservations');
console.log('- GET /users/meals-count');

export default router;