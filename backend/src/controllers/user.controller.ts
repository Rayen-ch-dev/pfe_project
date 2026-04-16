import { Request, Response } from "express";
import { createUserService,deleteUserService,getAllUsersService,getUserByIdService, updateUserService } from "../services/user.services";
import { AuthRequest } from "../middlewares/auth.middleware";

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

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    // Get user ID from decoded JWT token
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not found in token" });
    }

    // Fetch real user data from database
    const user = await getUserByIdService(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user profile data
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsersService();

    res.json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User ID required" });
    }

    const updatedUser = await updateUserService(id, {
      firstName,
      lastName,
      email,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User ID required" });
    }

    const deleted = await deleteUserService(id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updated = await updateUserService(userId, req.body);

    res.json({
      message: "Profile updated",
      user: updated,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
import bcrypt from "bcrypt";

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    const user = await getUserByIdService(userId!);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await updateUserService(userId!, { password: hashed });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const getUserPublicById = async (req: Request, res: Response) => {
  const user = await getUserByIdService(req.params.ID);

  if (!user) return res.status(404).json({ message: "Not found" });

  res.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
  });
};