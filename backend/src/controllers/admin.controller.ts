import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

// Get Dashboard Statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalUsers,
      activeReservations,
      allPayments,
      monthlyPayments,
    ] = await Promise.all([

      //  Count ALL users (not just approved)
      prisma.user.count(),

      //  Count ALL reservations regardless of date
      prisma.reservation.count({
        where: {
          status: { in: ['CONFIRMED', 'PENDING'] }
        }
      }),

      prisma.payment.findMany({
        where: { status: 'PAID' }
      }),

      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'PAID',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

    ]);

    const ticketsSold = allPayments.reduce(
      (total, payment) => total + Math.round(payment.amount / 0.2), 0
    );

    res.json({
      totalUsers,
      activeReservations,
      ticketsSold,
      monthlyRevenue: monthlyPayments._sum.amount ?? 0,
    });

  } catch (error: any) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Failed to get dashboard statistics' });
  }
};

// Get All Users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        documentImage: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error: any) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

// Get All Reservations
export const getAllReservations = async (req: Request, res: Response) => {
  try {
    const reservations = await prisma.reservation.findMany({
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
  } catch (error: any) {
    console.error('Error getting reservations:', error);
    res.status(500).json({ message: 'Failed to get reservations' });
  }
};

// Get All Payments
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
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
  } catch (error: any) {
    console.error('Error getting payments:', error);
    res.status(500).json({ message: 'Failed to get payments' });
  }
};

// Create New User
export const createUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
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
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// Update User Status
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
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
  } catch (error: any) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

// Update User
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, status } = req.body;

    // Get current user to check if email is being changed
    const currentUser = await prisma.user.findUnique({
      where: { id: req.params.id as string }
    });

    // Check if email is being changed and if it already exists
    if (currentUser && currentUser.email !== email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== id) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updateData: any = {
      firstName,
      lastName,
      email,
      role
    };

    // Only include status if it's a student or if status is provided
    if (role === 'STUDENT' && status) {
      updateData.status = status;
    } else if (role !== 'STUDENT') {
      // Non-student roles get APPROVED status by default
      updateData.status = 'APPROVED';
    }

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
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
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Delete User
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user (cascades will handle related records)
    await prisma.user.delete({
      where: { id: req.params.id as string }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Approve Payment
export const approvePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id as string },
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
    const updatedPayment = await prisma.payment.update({
      where: { id: req.params.id as string },
      data: { status: 'PAID' as const },
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
        await prisma.user.update({
          where: { id: payment.userId },
          data: { status: 'APPROVED' }
        });
      } catch (userError) {
        console.log('Could not update user status, but payment was approved:', userError);
      }
    }

    res.json(updatedPayment);
  } catch (error: any) {
    console.error('Error approving payment:', error);
    res.status(500).json({ message: 'Failed to approve payment' });
  }
};

export const makeUserAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
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
  } catch (error: any) {
    console.error('Error making user admin:', error);
    res.status(500).json({ message: 'Failed to make user admin' });
  }
};

export const updateAdminProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, email, currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get current user
    const user = await prisma.user.findUnique({
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

    const updateData: any = {};

    // Update basic info
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    // Update email (check if already exists)
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
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
    const updatedUser = await prisma.user.update({
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
  } catch (error: any) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Reject Payment
export const rejectPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id as string },
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
    const updatedPayment = await prisma.payment.update({
      where: { id: req.params.id as string },
      data: { status: 'CANCELLED' as const },
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
  } catch (error: any) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({ message: 'Failed to reject payment' });
  }
};

// Generate Report
export const generateReport = async (req: Request, res: Response) => {
  try {
    const { type, start, end } = req.query;

    if (!type || !start || !end) {
      return res.status(400).json({ message: 'Type, start, and end dates are required' });
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    let data: any = [];

    switch (type) {
      case 'users':
        data = await prisma.user.findMany({
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
        data = await prisma.reservation.findMany({
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
        data = await prisma.payment.findMany({
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
        data = await prisma.payment.findMany({
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
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

// Get Monthly Stats for Dashboard Charts
export const getMonthlyStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = [];

    // Get data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const users = await prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const reservations = await prisma.reservation.count({
        where: {
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const payments = await prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: {
          amount: true
        }
      });

      monthlyData.push({
        month: months[monthDate.getMonth()],
        users,
        reservations,
        revenue: payments._sum.amount || 0
      });
    }

    res.json(monthlyData);
  } catch (error: any) {
    console.error('Error getting monthly stats:', error);
    res.status(500).json({ message: 'Failed to get monthly stats' });
  }
};

// Get Meal Type Distribution
export const getMealDistribution = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Getting meal distribution...');
    
    const mealTypes = await prisma.meal.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    });

    console.log('📊 Raw meal types from database:', mealTypes);

    const distribution = mealTypes.map((meal, index) => {
      const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#F97316'];
      const typeNames = {
        'LUNCH': 'Déjeuner',
        'DINNER': 'Dîner'
      };

      const mapped = {
        name: typeNames[meal.type as keyof typeof typeNames] || meal.type,
        value: meal._count.id,
        color: colors[index % colors.length]
      };

      console.log(`🍽️ Mapping meal type ${meal.type}:`, mapped);
      return mapped;
    });

    console.log('📊 Final meal distribution data:', distribution);
    res.json(distribution);
  } catch (error: any) {
    console.error('Error getting meal distribution:', error);
    res.status(500).json({ message: 'Failed to get meal distribution' });
  }
};

// Get Weekly Activity
export const getWeeklyActivity = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const weeklyData = [];

    // Get data for the current week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Start from Monday
    startOfWeek.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const startOfDay = new Date(dayDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(dayDate.setHours(23, 59, 59, 999));

      const reservations = await prisma.reservation.count({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      const payments = await prisma.payment.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      weeklyData.push({
        day: days[i],
        reservations,
        payments
      });
    }

    console.log('📊 Weekly activity data:', weeklyData);
    console.log('📊 Weekly data characters:', weeklyData.map(d => ({ day: d.day, dayChars: d.day.split('').map(c => c.charCodeAt(0)) })));
    res.json(weeklyData);
  } catch (error: any) {
    console.error('Error getting weekly activity:', error);
    res.status(500).json({ message: 'Failed to get weekly activity' });
  }
};

// Get User Growth Data
export const getUserGrowth = async (req: Request, res: Response) => {
  try {
    console.log('🔍 getUserGrowth called - checking user data...');
    
    // First, let's see what users exist
    const allUsers = await prisma.user.findMany({
      select: {
        role: true,
        createdAt: true
      }
    });
    
    console.log('📊 Total users found:', allUsers.length);
    console.log('👥 User roles:', allUsers.map(u => u.role));
    console.log('📅 User creation dates:', allUsers.map(u => u.createdAt));

    const now = new Date();
    const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];
    const growthData = [];

    // Get data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      console.log(`🔍 Checking month: ${months[monthDate.getMonth()]} (${startOfMonth} to ${endOfMonth})`);

      const students = await prisma.user.count({
        where: {
          role: 'STUDENT',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const agents = await prisma.user.count({
        where: {
          role: 'AGENT_RESTAURANT',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const admins = await prisma.user.count({
        where: {
          role: 'ADMIN',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      console.log(`📊 ${months[monthDate.getMonth()]}: students=${students}, agents=${agents}, admins=${admins}`);

      growthData.push({
        month: months[monthDate.getMonth()],
        students,
        agents,
        admins
      });
    }

    res.json(growthData);
  } catch (error: any) {
    console.error('Error getting user growth:', error);
    res.status(500).json({ message: 'Failed to get user growth' });
  }
};

// Test endpoint to verify API is working - NOW USES REAL DATA
export const testChartData = async (req: Request, res: Response) => {
  try {
    console.log('Test endpoint called - using REAL database data');
    
    // Get REAL data from database
    const now = new Date();
    const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun'];
    const realMonthlyData = [];

    // Get last 6 months of REAL data
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const users = await prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const reservations = await prisma.reservation.count({
        where: {
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const payments = await prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: {
          amount: true
        }
      });

      realMonthlyData.push({
        month: months[monthDate.getMonth()],
        users,
        reservations,
        revenue: payments._sum.amount || 0
      });
    }

    // Get REAL meal distribution
    const realMealTypes = await prisma.meal.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    });

    const realMealDistribution = realMealTypes.map((meal, index) => {
      const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];
      const typeNames = {
        'LUNCH': 'Déjeuner',
        'DINNER': 'Dîner'
      };

      return {
        name: typeNames[meal.type as keyof typeof typeNames] || meal.type,
        value: meal._count.id,
        color: colors[index % colors.length]
      };
    });

    // Get REAL weekly activity
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const realWeeklyData = [];

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const startOfDay = new Date(dayDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(dayDate.setHours(23, 59, 59, 999));

      const dayReservations = await prisma.reservation.count({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      const dayPayments = await prisma.payment.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      realWeeklyData.push({
        day: days[i],
        reservations: dayReservations,
        payments: dayPayments
      });
    }

    // Get REAL user growth
    const realGrowthData = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const students = await prisma.user.count({
        where: {
          role: 'STUDENT',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const agents = await prisma.user.count({
        where: {
          role: 'AGENT_RESTAURANT',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const admins = await prisma.user.count({
        where: {
          role: 'ADMIN',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      realGrowthData.push({
        month: months[monthDate.getMonth()],
        students,
        agents,
        admins
      });
    }

    const realData = {
      monthly: realMonthlyData,
      meals: realMealDistribution,
      weekly: realWeeklyData,
      growth: realGrowthData
    };

    console.log('✅ Returning REAL database data:', realData);
    res.json(realData);
  } catch (error: any) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ message: 'Test endpoint failed' });
  }
};
