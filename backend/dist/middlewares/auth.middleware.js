"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.paymentAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const authMiddleware = async (req, res, next) => {
    // Check for token in Authorization header (for mobile app) or cookies (for web)
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : cookieToken;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Check if user still exists and has approved status
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, role: true, status: true }
        });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        // Check approval status for non-admin users
        if (user.role !== "ADMIN" && user.status !== "APPROVED") {
            return res.status(403).json({ message: "Account not approved by admin" });
        }
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ message: "Invalid token" });
    }
};
exports.authMiddleware = authMiddleware;
// Payment auth middleware - allows pending students to make purchases
const paymentAuthMiddleware = async (req, res, next) => {
    // Check for token in Authorization header (for mobile app) or cookies (for web)
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : cookieToken;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Check if user still exists
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, role: true, status: true }
        });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        // For payment operations, allow:
        // - Admin users (any status)
        // - Students with APPROVED status
        // - Students with PENDING status (to allow office payment)
        if (user.role === "ADMIN" ||
            (user.role === "STUDENT" && (user.status === "APPROVED" || user.status === "PENDING"))) {
            req.user = decoded;
            next();
        }
        else {
            return res.status(403).json({ message: "Account not approved for payments" });
        }
    }
    catch {
        res.status(401).json({ message: "Invalid token" });
    }
};
exports.paymentAuthMiddleware = paymentAuthMiddleware;
// Re-export admin middleware for convenience
var admin_middleware_1 = require("./admin.middleware");
Object.defineProperty(exports, "adminMiddleware", { enumerable: true, get: function () { return admin_middleware_1.adminMiddleware; } });
//# sourceMappingURL=auth.middleware.js.map