"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdmin = exports.registerAgentRestaurant = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const register = async (firstName, lastName, email, password) => {
    const exist = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (exist)
        throw new Error("User already exists");
    const hashed = await bcrypt_1.default.hash(password, 10);
    return prisma_1.prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            password: hashed,
        },
    });
};
exports.register = register;
const login = async (email, password) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new Error("Invalid credentials");
    const ok = await bcrypt_1.default.compare(password, user.password);
    if (!ok)
        throw new Error("Invalid credentials");
    if ((user.role === "STUDENT" || user.role === "AGENT_RESTAURANT") && user.status !== "APPROVED") {
        throw new Error("Account not approved by admin");
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return token;
};
exports.login = login;
const registerAgentRestaurant = async (firstName, lastName, email, password) => {
    const exist = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (exist)
        throw new Error("User already exists");
    const hashed = await bcrypt_1.default.hash(password, 10);
    return prisma_1.prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            password: hashed,
            role: "AGENT_RESTAURANT",
            status: "APPROVED" // Admin-created agents are approved by default
        },
    });
};
exports.registerAgentRestaurant = registerAgentRestaurant;
const registerAdmin = async (firstName, lastName, email, password) => {
    const exist = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (exist)
        throw new Error("User already exists");
    const hashed = await bcrypt_1.default.hash(password, 10);
    return prisma_1.prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            password: hashed,
            role: "ADMIN",
            status: "APPROVED"
        },
    });
};
exports.registerAdmin = registerAdmin;
//# sourceMappingURL=auth.service.js.map