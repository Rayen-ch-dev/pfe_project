import { Request, Response } from "express";
import * as authService from "../services/auth.service";

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const user = await authService.register(
      firstName,
      lastName,
      email,
      password
    );

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);

    // Get user data to return with token
    const { prisma } = await import("../lib/prisma");
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "lax",
    });

    res.json({
      message: "logged in",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// REGISTER AGENT RESTAURANT (ADMIN ONLY)
export const registerAgentRestaurant = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const agent = await authService.registerAgentRestaurant(
      firstName,
      lastName,
      email,
      password
    );

    res.status(201).json({
      message: "Agent restaurant created successfully and is ready to use.",
      agent,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// REGISTER ADMIN
export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const admin = await authService.registerAdmin(
      firstName,
      lastName,
      email,
      password
    );

    res.status(201).json({
      message: "Admin created successfully",
      admin,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};