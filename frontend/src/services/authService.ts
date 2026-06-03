import { api } from './apiClient';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      console.log('Attempting login...');
      const response = await api.post<AuthResponse>('/api/auth/login', data);
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      console.log('Attempting registration...');
      const response = await api.post<AuthResponse>('/api/auth/register', data);
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
  },

  getUserProfile: async (): Promise<User> => {
    try {
      console.log('Fetching user profile...');
      const response = await api.get<User>('/api/users/profile');
      return response;
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  },

  logout: () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Helper method to check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Helper method to get current user
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
