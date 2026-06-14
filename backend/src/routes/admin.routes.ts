import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import recipeRoutes from "./recipe.routes";

const router = Router();

// Public debug endpoint (no auth required)
router.get("/debug", adminController.testChartData);

// Apply authentication and admin middleware to all other routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard statistics
router.get("/stats", adminController.getDashboardStats);

// Users management
router.get("/users", adminController.getAllUsers);
router.post("/users", adminController.createUser);
router.put("/users/:id", adminController.updateUser);
router.put("/users/:id/status", adminController.updateUserStatus);
router.delete("/users/:id", adminController.deleteUser);
router.post("/make-admin", adminController.makeUserAdmin);
router.put("/profile", adminController.updateAdminProfile);

// Reservations management
router.get("/reservations", adminController.getAllReservations);

// Payments management
router.get("/payments", adminController.getAllPayments);
router.put("/payments/:id/approve", adminController.approvePayment);
router.put("/payments/:id/reject", adminController.rejectPayment);

// Reports generation
router.get("/reports", adminController.generateReport);

// Dashboard charts data
router.get("/monthly-stats", adminController.getMonthlyStats);
router.get("/meal-distribution", adminController.getMealDistribution);
router.get("/weekly-activity", adminController.getWeeklyActivity);
router.get("/user-growth", adminController.getUserGrowth);

// Test endpoint
router.get("/test-data", adminController.testChartData);

// Recipe management
router.use("/recipes", recipeRoutes);

export default router;
