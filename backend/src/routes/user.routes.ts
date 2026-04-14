import { Router } from "express";
import { createUser, getUserById } from "../controllers/user.controller";

const router = Router();

// POST /api/users
router.post("/", createUser);
// GET USER BY ID
router.get("/:id", getUserById);

export default router;