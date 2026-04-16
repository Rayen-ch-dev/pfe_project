import { prisma } from "../lib/prisma";

/**
 * CREATE USER
 */
export const createUserService = async (
  firstName: string,
  lastName: string,
  email: string
) => {
  return prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
    },
  });
};

/**
 * GET USER BY ID
 */
export const getUserByIdService = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

/**
 * GET ALL USERS
 */
export const getAllUsersService = async () => {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
};

/**
 * UPDATE USER
 */
export const updateUserService = async (id: string, data: any) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

/**
 * DELETE USER
 */
export const deleteUserService = async (id: string) => {
  try {
    await prisma.user.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
};