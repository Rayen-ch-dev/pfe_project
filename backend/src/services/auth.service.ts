import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export const register = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
) => {
  const exist = await prisma.user.findUnique({ where: { email } });

  if (exist) throw new Error("User already exists");

  const hashed = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashed,
    },
  });
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("Invalid credentials");

  const ok = await bcrypt.compare(password, user.password);

  if (!ok) throw new Error("Invalid credentials");

  if (user.role === "STUDENT" && user.status !== "APPROVED") {
    throw new Error("Account not approved by admin");
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return token;
};

export const registerAdmin = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
) => {
  const exist = await prisma.user.findUnique({ where: { email } });

  if (exist) throw new Error("User already exists");

  const hashed = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashed,
      role: "ADMIN",
      status: undefined
    },
  });
};