import { Request, Response } from "express";
import * as authService from "../services/auth.service";

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role, documentImage } = req.body;

    // Default role to STUDENT if not provided (mobile app registration)
    const userRole = role || "STUDENT";

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let user;

    // Handle different roles
    if (userRole === "STUDENT") {
      // For students, document is required
      if (!documentImage) {
        return res.status(400).json({ message: "Document d'identification requis pour les étudiants" });
      }
      user = await authService.registerStudent(firstName, lastName, email, password, documentImage);
    } else if (userRole === "AGENT_RESTAURANT") {
      // For agents, document is not required, they can register directly
      user = await authService.registerAgentRestaurant(firstName, lastName, email, password);
    } else {
      return res.status(400).json({ message: "Invalid role. Must be STUDENT or AGENT_RESTAURANT" });
    }
    
    res.status(201).json({
      message: userRole === "STUDENT" 
        ? "User registered successfully. Your account is pending approval."
        : "Agent restaurant created successfully and is ready to use.",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(400).json({ message: error.message });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);

    // Get user data to return with token
    const { prisma } = await import("../lib/prisma");
    console.log('🔍 Login attempt for email:', email);
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    console.log('📊 User found in database:', user);

    if (!user) {
      throw new Error("User not found");
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "lax",
    });

    const responseUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };

    console.log('📤 User object being sent to frontend:', responseUser);

    res.json({
      message: "logged in",
      token,
      user: responseUser,
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