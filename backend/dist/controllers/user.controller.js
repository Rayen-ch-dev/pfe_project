"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTickets = exports.getUserPublicById = exports.changePassword = exports.updateMyProfile = exports.deleteUser = exports.updateUser = exports.getAllUsers = exports.getUserProfile = exports.getUserById = exports.createUser = void 0;
const user_services_1 = require("../services/user.services");
const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;
        if (!firstName || !lastName || !email) {
            return res.status(400).json({ message: "Missing fields" });
        }
        const user = await (0, user_services_1.createUserService)(firstName, lastName, email, "STUDENT");
        res.status(201).json({
            message: "User created successfully",
            user,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.createUser = createUser;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        const user = await (0, user_services_1.getUserByIdService)(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getUserById = getUserById;
const getUserProfile = async (req, res) => {
    try {
        // Get user ID from decoded JWT token
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "User not found in token" });
        }
        // Fetch real user data from database
        const user = await (0, user_services_1.getUserByIdService)(userId);
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
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getUserProfile = getUserProfile;
const getAllUsers = async (req, res) => {
    try {
        const users = await (0, user_services_1.getAllUsersService)();
        res.json({
            message: "Users fetched successfully",
            users,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.getAllUsers = getAllUsers;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email } = req.body;
        if (!id || Array.isArray(id)) {
            return res.status(400).json({ message: "User ID required" });
        }
        const updatedUser = await (0, user_services_1.updateUserService)(id, {
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
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) {
            return res.status(400).json({ message: "User ID required" });
        }
        const deleted = await (0, user_services_1.deleteUserService)(id);
        if (!deleted) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            message: "User deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.deleteUser = deleteUser;
const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const updated = await (0, user_services_1.updateUserService)(userId, req.body);
        res.json({
            message: "Profile updated",
            user: updated,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.updateMyProfile = updateMyProfile;
const bcrypt_1 = __importDefault(require("bcrypt"));
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { oldPassword, newPassword } = req.body;
        const user = await (0, user_services_1.getUserByIdService)(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await bcrypt_1.default.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Old password incorrect" });
        }
        const hashed = await bcrypt_1.default.hash(newPassword, 10);
        await (0, user_services_1.updateUserService)(userId, { password: hashed });
        res.json({ message: "Password updated successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
exports.changePassword = changePassword;
const getUserPublicById = async (req, res) => {
    const { ID } = req.params;
    if (!ID || Array.isArray(ID)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await (0, user_services_1.getUserByIdService)(ID);
    if (!user)
        return res.status(404).json({ message: "Not found" });
    res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
    });
};
exports.getUserPublicById = getUserPublicById;
const getUserTickets = async (req, res) => {
    try {
        // For now, return a mock response since we don't have a tickets table
        // In a real implementation, you would query a tickets or reservations table
        const mockTicketData = {
            remainingTickets: 8,
            totalTickets: 12,
            usedTickets: 4,
        };
        res.json(mockTicketData);
    }
    catch (error) {
        console.error("Error fetching user tickets:", error);
        res.status(500).json({ error: "Failed to fetch user tickets" });
    }
};
exports.getUserTickets = getUserTickets;
//# sourceMappingURL=user.controller.js.map