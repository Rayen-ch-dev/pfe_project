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
    const token = await authService.login(
      req.body.email,
      req.body.password
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "lax",
    });

    res.json({
      message: "logged in",
      token,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
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