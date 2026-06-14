import axios from "axios";

// Using your PC IP address for mobile app connection
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.18:5000";

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

export interface Package {
  id: string;
  name: string;
  price: number;
}

export const getPackages = async (token: string) => {
  try {
    const fullUrl = `${API_URL}/api/users/packages`;
    console.log('=== DEBUG ===');
    console.log('API_URL:', API_URL);
    console.log('Full URL:', fullUrl);
    console.log('Fetching packages from:', fullUrl);
    
    const response = await api.get('api/users/packages', {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    console.log('=== END DEBUG ===');
    
    return response;
  } catch (error: any) {
    console.error('Packages fetch error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/users/packages`
    });
    throw error;
  }
};

export const purchasePackage = async (packageId: string, token: string) => {
  try {
    console.log('=== PURCHASE DEBUG ===');
    console.log('Purchasing package:', packageId);
    console.log('Token exists:', !!token);
    console.log('Token length:', token?.length);
    console.log('Token preview:', token?.substring(0, 20) + '...');
    console.log('Authorization header:', `Bearer ${token?.substring(0, 20)}...`);
    
    // Create a custom axios instance for this request
    const authenticatedApi = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('Making authenticated request to:', `${API_URL}/api/users/payments/purchase`);
    
    const response = await authenticatedApi.post('/api/users/payments/purchase', { packageId });
    console.log('Purchase successful:', response.data);
    console.log('=== END PURCHASE DEBUG ===');
    return response;
  } catch (error: any) {
    console.error('Package purchase error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/users/payments/purchase`
    });
    console.error('Request headers:', error.config?.headers);
    console.error('=== END PURCHASE DEBUG ===');
    throw error;
  }
};

export const purchaseCustomTickets = async (tickets: number, token: string) => {
  try {
    console.log('Purchasing custom tickets:', tickets);
    const response = await api.post('api/users/payments/custom', 
      { tickets },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );
    return response;
  } catch (error: any) {
    console.error('Custom tickets purchase error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/payments/custom`
    });
    throw error;
  }
};

export const getUserTickets = async (token: string) => {
  try {
    console.log('Fetching REAL user tickets from:', `${API_URL}/api/users/tickets`);
    const response = await api.get('api/users/tickets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    console.log('Real tickets response:', response.data);
    return response;
  } catch (error: any) {
    console.error('Real tickets fetch error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/users/tickets`
    });
    throw error;
  }
};

export const getMonthlyMealsCount = async (token: string) => {
  try {
    console.log('Getting monthly meals count...');
    const response = await api.get('api/users/meals-count', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Monthly meals response:', response.data);
    return response;
  } catch (error: any) {
    console.error('Get monthly meals error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/users/meals-count`
    });
    throw error;
  }
};

export const updateUserProfile = async (token: string, userData: {
  firstName: string;
  lastName: string;
  email: string;
}) => {
  try {
    console.log('Updating user profile...');
    const response = await api.put('api/users/profile', userData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Update profile response:', response.data);
    return response;
  } catch (error: any) {
    console.error('Update profile error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/users/profile`
    });
    throw error;
  }
};

export const createReservation = async (
  mealType: string = 'DINNER',
  date?: Date,
  token?: string,
  options?: { forMealType?: 'LUNCH' | 'DINNER' }
) => {
  try {
    console.log('Creating reservation for:', mealType);
    const body: Record<string, unknown> = {
      mealType,
      date: date || new Date(),
    };
    if (mealType === 'CHECK' && options?.forMealType) {
      body.forMealType = options.forMealType;
    }
    const response = await api.post('api/users/reservations',
      body,
      {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        }
      }
    );
    return response;
  } catch (error: any) {
    console.error('Reservation creation error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/users/reservations`
    });
    throw error;
  }
};

export const getAgentStatistics = async (token: string) => {
  try {
    console.log('Getting agent statistics...');
    const response = await api.get('api/agent-restaurant/statistics', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Agent statistics response:', response.data);
    return response;
  } catch (error: any) {
    console.error('Get agent statistics error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/agent-restaurant/statistics`
    });
    throw error;
  }
};

export default {
  getPackages,
  purchasePackage,
  purchaseCustomTickets,
  getUserTickets,
  createReservation
};
