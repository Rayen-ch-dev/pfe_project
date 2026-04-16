import axios from "axios";

// Using your PC IP address for mobile app connection
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.15:5000";
// Your PC IP: 192.168.1.15
// This allows mobile app to connect to your backend server

// Configure axios with better error handling
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Handle CORS for mobile app
  withCredentials: false,
});

export const login = async (data: any) => {
  try {
    console.log('Attempting login to:', `${API_URL}/api/auth/login`);
    const response = await api.post('/api/auth/login', data);
    return response;
  } catch (error: any) {
    console.error('Login error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/auth/login`
    });
    throw error;
  }
};

export const register = async (data: any) => {
  try {
    console.log('Attempting register to:', `${API_URL}/api/auth/register`);
    console.log('Register data:', { ...data, password: '***' });
    const response = await api.post('/api/auth/register', data);
    return response;
  } catch (error: any) {
    console.error('Register error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/auth/register`
    });
    throw error;
  }
};

export const getUserProfile = async (token: string) => {
  try {
    console.log('Fetching user profile from:', `${API_URL}/api/users/profile`);
    const response = await api.get('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    return response;
  } catch (error: any) {
    console.error('Profile fetch error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/users/profile`
    });
    throw error;
  }
};