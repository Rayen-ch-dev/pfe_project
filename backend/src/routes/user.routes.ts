import { Router } from "express";
import {
  createUser,
  getUserById,
  getUserProfile,
  getAllUsers,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";

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

/**
 * ADMIN ONLY
 */
router.get("/", authMiddleware, adminMiddleware, getAllUsers);
router.get("/:id", authMiddleware, adminMiddleware, getUserById);
router.put("/:id", authMiddleware, adminMiddleware, updateUser);
router.delete("/:id", authMiddleware, adminMiddleware, deleteUser);

export default router;