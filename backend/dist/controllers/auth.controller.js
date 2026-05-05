"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdmin = exports.registerAgentRestaurant = exports.login = exports.register = void 0;
const authService = __importStar(require("../services/auth.service"));
// REGISTER
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const user = await authService.register(firstName, lastName, email, password);
        res.status(201).json({
            message: "User created successfully",
            user,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
exports.register = register;
// LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await authService.login(email, password);
        // Get user data to return with token
        const { prisma } = await Promise.resolve().then(() => __importStar(require("../lib/prisma")));
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
    }
    catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};
exports.login = login;
// REGISTER AGENT RESTAURANT (ADMIN ONLY)
const registerAgentRestaurant = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const agent = await authService.registerAgentRestaurant(firstName, lastName, email, password);
        res.status(201).json({
            message: "Agent restaurant created successfully and is ready to use.",
            agent,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.registerAgentRestaurant = registerAgentRestaurant;
// REGISTER ADMIN
const registerAdmin = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const admin = await authService.registerAdmin(firstName, lastName, email, password);
        res.status(201).json({
            message: "Admin created successfully",
            admin,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.registerAdmin = registerAdmin;
//# sourceMappingURL=auth.controller.js.map