import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../services/authService';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('🔍 Loading stored auth data...');
      console.log('📧 Stored token:', storedToken ? 'exists' : 'missing');
      console.log('👤 Stored user:', storedUser);
      
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ Parsed user from localStorage:', parsedUser);
        
        // TEMPORARY FIX: If user has no email, clear localStorage to force fresh login
        if (!parsedUser.email) {
          console.log('🧹 User has no email - clearing localStorage to force fresh login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLoading(false);
          return;
        }
        
        setToken(storedToken);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Failed to load auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { authService } = await import('../services/authService');
      const response = await authService.login({ email, password });
      
      console.log('🔐 Login response received:', response);
      console.log('👤 User object in response:', response.user);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      console.log('💾 Saved user to localStorage:', response.user);
      
      setToken(response.token);
      setUser(response.user);
      
      return response;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    try {
      const { authService } = await import('../services/authService');
      const response = await authService.register({ firstName, lastName, email, password });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.token);
      setUser(response.user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  // Debug logging
  console.log('AuthContext State:', {
    user,
    token: token ? '***' : null,
    loading,
    isAuthenticated: !!token,
    userRole: user?.role
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
