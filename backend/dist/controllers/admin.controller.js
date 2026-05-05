"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = exports.rejectPayment = exports.updateAdminProfile = exports.makeUserAdmin = exports.approvePayment = exports.deleteUser = exports.updateUser = exports.updateUserStatus = exports.createUser = exports.getAllPayments = exports.getAllReservations = exports.getAllUsers = exports.getDashboardStats = void 0;
const prisma_1 = require("../lib/prisma");
// Get Dashboard Statistics
const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        // Get total users
        const totalUsers = await prisma_1.prisma.user.count();
        // Get active reservations (confirmed)
        const activeReservations = await prisma_1.prisma.reservation.count({
            where: {
                status: 'CONFIRMED',
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });
        // Get total tickets sold from payments
        const payments = await prisma_1.prisma.payment.findMany({
            where: {
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });
        const ticketsSold = payments.reduce((total, payment) => total + Math.round(payment.amount / 0.2), 0);
        const monthlyRevenue = payments.reduce((total, payment) => total + payment.amount, 0);
        res.json({
            totalUsers,
            activeReservations,
            ticketsSold,
            monthlyRevenue
        });
    }
    catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ message: 'Failed to get dashboard statistics' });
    }
};
exports.getDashboardStats = getDashboardStats;
// Get All Users
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(users);
    }
    catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Failed to get users' });
    }
};
exports.getAllUsers = getAllUsers;
// Get All Reservations
const getAllReservations = async (req, res) => {
    try {
        const reservations = await prisma_1.prisma.reservation.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                meal: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(reservations);
    }
    catch (error) {
        console.error('Error getting reservations:', error);
        res.status(500).json({ message: 'Failed to get reservations' });
    }
};
exports.getAllReservations = getAllReservations;
// Get All Payments
const getAllPayments = async (req, res) => {
    try {
        const payments = await prisma_1.prisma.payment.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Transform the data to match frontend expectations
        const transformedPayments = payments.map(payment => ({
            ...payment,
            // Map createdAt to date for frontend compatibility
            date: payment.createdAt,
            // Calculate tickets based on amount (1 DT = 5 tickets)
            // Use Math.round to handle floating-point precision issues
            ticketsAdded: Math.round(payment.amount / 0.2)
        }));
        res.json(transformedPayments);
    }
    catch (error) {
        console.error('Error getting payments:', error);
        res.status(500).json({ message: 'Failed to get payments' });
    }
};
exports.getAllPayments = getAllPayments;
// Create New User
const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;
        // Check if user already exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Hash password
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
                status: role === 'STUDENT' ? 'PENDING' : 'APPROVED'
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true
            }
        });
        res.status(201).json(user);
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Failed to create user' });
    }
};
exports.createUser = createUser;
// Update User Status
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = await prisma_1.prisma.user.update({
            where: { id: req.params.id },
            data: { status },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true
            }
        });
        res.json(user);
    }
    catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ message: 'Failed to update user status' });
    }
};
exports.updateUserStatus = updateUserStatus;
// Update User
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, role, status } = req.body;
        // Get current user to check if email is being changed
        const currentUser = await prisma_1.prisma.user.findUnique({
            where: { id: req.params.id }
        });
        // Check if email is being changed and if it already exists
        if (currentUser && currentUser.email !== email) {
            const existingUser = await prisma_1.prisma.user.findUnique({
                where: { email }
            });
            if (existingUser && existingUser.id !== id) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }
        const updateData = {
            firstName,
            lastName,
            email,
            role
        };
        // Only include status if it's a student or if status is provided
        if (role === 'STUDENT' && status) {
            updateData.status = status;
        }
        else if (role !== 'STUDENT') {
            // Non-student roles get APPROVED status by default
            updateData.status = 'APPROVED';
        }
        const user = await prisma_1.prisma.user.update({
            where: { id: req.params.id },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true
            }
        });
        res.json(user);
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user' });
    }
};
exports.updateUser = updateUser;
// Delete User
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if user exists
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.params.id }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Delete user (cascades will handle related records)
        await prisma_1.prisma.user.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
};
exports.deleteUser = deleteUser;
// Approve Payment
const approvePayment = async (req, res) => {
    try {
        const { id } = req.params;
        // Get payment details
        const payment = await prisma_1.prisma.payment.findUnique({
            where: { id: req.params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        // Update payment status to PAID
        const updatedPayment = await prisma_1.prisma.payment.update({
            where: { id: req.params.id },
            data: { status: 'PAID' },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        // Update user status to APPROVED if they're a student
        if (payment.user && payment.user.role === 'STUDENT') {
            try {
                await prisma_1.prisma.user.update({
                    where: { id: payment.userId },
                    data: { status: 'APPROVED' }
                });
            }
            catch (userError) {
                console.log('Could not update user status, but payment was approved:', userError);
            }
        }
        res.json(updatedPayment);
    }
    catch (error) {
        console.error('Error approving payment:', error);
        res.status(500).json({ message: 'Failed to approve payment' });
    }
};
exports.approvePayment = approvePayment;
const makeUserAdmin = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const updatedUser = await prisma_1.prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
            }
        });
        res.json({
            message: `✅ ${updatedUser.firstName} ${updatedUser.lastName} is now an ADMIN`,
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Error making user admin:', error);
        res.status(500).json({ message: 'Failed to make user admin' });
    }
};
exports.makeUserAdmin = makeUserAdmin;
const updateAdminProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { firstName, lastName, email, currentPassword, newPassword } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Get current user
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                password: true,
                role: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Check if user is admin
        if (user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        const updateData = {};
        // Update basic info
        if (firstName)
            updateData.firstName = firstName;
        if (lastName)
            updateData.lastName = lastName;
        // Update email (check if already exists)
        if (email && email !== user.email) {
            const existingUser = await prisma_1.prisma.user.findUnique({
                where: { email }
            });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            updateData.email = email;
        }
        // Update password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required to change password' });
            }
            const bcrypt = require('bcrypt');
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedNewPassword;
        }
        // Update user
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                status: true
            }
        });
        res.json({
            message: '✅ Profile updated successfully',
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
};
exports.updateAdminProfile = updateAdminProfile;
// Reject Payment
const rejectPayment = async (req, res) => {
    try {
        const { id } = req.params;
        // Get payment details
        const payment = await prisma_1.prisma.payment.findUnique({
            where: { id: req.params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        // Update payment status to CANCELLED
        const updatedPayment = await prisma_1.prisma.payment.update({
            where: { id: req.params.id },
            data: { status: 'CANCELLED' },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        res.json(updatedPayment);
    }
    catch (error) {
        console.error('Error rejecting payment:', error);
        res.status(500).json({ message: 'Failed to reject payment' });
    }
};
exports.rejectPayment = rejectPayment;
// Generate Report
const generateReport = async (req, res) => {
    try {
        const { type, start, end } = req.query;
        if (!type || !start || !end) {
            return res.status(400).json({ message: 'Type, start, and end dates are required' });
        }
        const startDate = new Date(start);
        const endDate = new Date(end);
        let data = [];
        switch (type) {
            case 'users':
                data = await prisma_1.prisma.user.findMany({
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        status: true,
                        createdAt: true
                    },
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
                break;
            case 'reservations':
                data = await prisma_1.prisma.reservation.findMany({
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    },
                    where: {
                        date: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    orderBy: {
                        date: 'desc'
                    }
                });
                break;
            case 'payments':
                data = await prisma_1.prisma.payment.findMany({
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    },
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
                break;
            case 'revenue':
                data = await prisma_1.prisma.payment.findMany({
                    select: {
                        id: true,
                        amount: true,
                        createdAt: true,
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    },
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
                break;
            default:
                return res.status(400).json({ message: 'Invalid report type' });
        }
        res.json(data);
    }
    catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Failed to generate report' });
    }
};
exports.generateReport = generateReport;
//# sourceMappingURL=admin.controller.js.map