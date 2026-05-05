"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserService = exports.updateUserService = exports.getAllUsersService = exports.getUserByIdService = exports.createUserService = void 0;
const prisma_1 = require("../lib/prisma");
/**
 * CREATE USER
 */
const createUserService = async (firstName, lastName, email, password) => {
    return prisma_1.prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            password,
        },
    });
};
exports.createUserService = createUserService;
/**
 * GET USER BY ID
 */
const getUserByIdService = async (id) => {
    return prisma_1.prisma.user.findUnique({
        where: { id },
    });
};
exports.getUserByIdService = getUserByIdService;
/**
 * GET ALL USERS
 */
const getAllUsersService = async () => {
    return prisma_1.prisma.user.findMany({
        orderBy: { createdAt: "desc" },
    });
};
exports.getAllUsersService = getAllUsersService;
/**
 * UPDATE USER
 */
const updateUserService = async (id, data) => {
    return prisma_1.prisma.user.update({
        where: { id },
        data,
    });
};
exports.updateUserService = updateUserService;
/**
 * DELETE USER
 */
const deleteUserService = async (id) => {
    try {
        await prisma_1.prisma.user.delete({
            where: { id },
        });
        return true;
    }
    catch {
        return false;
    }
};
exports.deleteUserService = deleteUserService;
//# sourceMappingURL=user.services.js.map