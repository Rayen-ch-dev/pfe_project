import { Request, Response } from "express";
import { createUserService,getUserByIdService } from "../services/user.services";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await createUserService(firstName, lastName, email);

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await getUserByIdService(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};