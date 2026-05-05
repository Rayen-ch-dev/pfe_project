import { api } from './apiClient';

export interface DashboardStats {
  totalUsers: number;
  activeReservations: number;
  ticketsSold: number;
  monthlyRevenue: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status?: string;
  createdAt: string;
  documentImage?: string;
}

export interface Reservation {
  id: string;
  date: string;
  createdAt: string;
  status: string;
  mealType: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  qrCode?: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  userId: string;
  ticketsAdded: number;
  status: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const dashboardService = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    try {
      console.log('📊 Fetching dashboard stats...');
      const response = await api.get<DashboardStats>('/api/admin/stats');
      
      console.log('📊 Dashboard stats response:', response);
      
      // Ensure all values are present and valid
      const stats = {
        totalUsers: response.totalUsers || 0,
        activeReservations: response.activeReservations || 0,
        ticketsSold: response.ticketsSold || 0,
        monthlyRevenue: response.monthlyRevenue || 0
      };
      
      console.log('📊 Processed stats:', stats);
      return stats;
    } catch (error: any) {
      console.error('❌ Failed to fetch dashboard stats:', error);
      
      // Return default values on error
      return {
        totalUsers: 0,
        activeReservations: 0,
        ticketsSold: 0,
        monthlyRevenue: 0
      };
    }
  },

  // Get all users
  getUsers: async (): Promise<User[]> => {
    try {
      console.log('👥 Fetching all users...');
      const response = await api.get<User[]>('/api/admin/users');
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch users:', error);
      throw error;
    }
  },

  // Get all reservations
  getReservations: async (): Promise<Reservation[]> => {
    try {
      console.log('📅 Fetching all reservations...');
      const response = await api.get<any[]>('/api/admin/reservations');
      
      // Transform the data to match the frontend interface
      const transformedReservations = response.map(reservation => ({
        ...reservation,
        mealType: reservation.meal?.type || 'UNKNOWN',
        date: reservation.date || reservation.createdAt,
      }));
      
      return transformedReservations;
    } catch (error: any) {
      console.error('❌ Failed to fetch reservations:', error);
      throw error;
    }
  },

  // Get all payments
  getPayments: async (): Promise<Payment[]> => {
    try {
      console.log('💰 Fetching all payments...');
      const payments = await api.get('/api/admin/payments');
      console.log('💰 Raw API response:', payments);
      return payments;
    } catch (error: any) {
      console.error('❌ Failed to fetch payments:', error);
      throw error;
    }
  },

  // Create new user
  createUser: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
  }): Promise<User> => {
    try {
      console.log('👤 Creating new user...');
      const response = await api.post<User>('/api/admin/users', userData);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to create user:', error);
      throw error;
    }
  },

  // Update user status
  updateUserStatus: async (userId: string, status: string): Promise<User> => {
    try {
      console.log('🔄 Updating user status...');
      const response = await api.put<User>(`/api/admin/users/${userId}/status`, { status });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to update user status:', error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting user...');
      await api.delete(`/api/admin/users/${userId}`);
    } catch (error: any) {
      console.error('❌ Failed to delete user:', error);
      throw error;
    }
  },

  // Generate report
  generateReport: async (type: string, dateRange?: { start: string; end: string }): Promise<any> => {
    try {
      console.log('📈 Generating report...');
      const params = dateRange ? { type, ...dateRange } : { type };
      const response = await api.get('/api/admin/reports', { params });
      return response;
    } catch (error: any) {
      console.error('❌ Failed to generate report:', error);
      throw error;
    }
  },

  // Update User
  updateUser: async (userId: string, userData: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status?: string;
  }): Promise<User> => {
    try {
      console.log('👤 Updating user with ID:', userId);
      console.log('📝 User data:', userData);
      console.log('📡 API endpoint:', `/api/admin/users/${userId}`);
      console.log('🔧 Request method: PUT');
      
      const response = await api.put<User>(`/api/admin/users/${userId}`, userData);
      console.log('✅ API response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to update user:', error);
      console.error('📄 Error response:', error.response);
      console.error('🔢 Error status:', error.response?.status);
      console.error('🔍 Full error object:', error);
      throw error;
    }
  },

  // Create User
  createUser: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
  }): Promise<User> => {
    try {
      console.log('👤 Creating new user...');
      console.log('📝 User data:', { ...userData, password: '***' });
      console.log('📡 API endpoint: /api/admin/users');
      console.log('🔧 Request method: POST');
      
      const response = await api.post<User>('/api/admin/users', userData);
      console.log('✅ User created successfully:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to create user:', error);
      console.error('📄 Error response:', error.response);
      console.error('🔢 Error status:', error.response?.status);
      console.error('🔍 Full error object:', error);
      throw error;
    }
  },

  // Update Reservation Status
  updateReservationStatus: async (reservationId: string, status: string): Promise<Reservation> => {
    try {
      console.log('🔄 Updating reservation status...');
      console.log('📝 Reservation ID:', reservationId);
      console.log('📝 New status:', status);
      
      const response = await api.put<Reservation>(`/api/admin/reservations/${reservationId}/status`, { status });
      console.log('✅ Reservation status updated successfully:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to update reservation status:', error);
      console.error('📄 Error response:', error.response);
      console.error('🔢 Error status:', error.response?.status);
      console.error('🔍 Full error object:', error);
      throw error;
    }
  },

  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/api/users/profile');
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  },

  // Update admin profile
  updateAdminProfile: async (data: any) => {
    try {
      const response = await api.put('/api/admin/profile', data);
      return response.data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }
};
