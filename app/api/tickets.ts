import axios from "axios";

// Using your PC IP address for mobile app connection
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.15:5000";

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
    console.log('Purchasing package:', packageId);
    const response = await api.post('api/users/payments/purchase', 
      { packageId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );
    return response;
  } catch (error: any) {
    console.error('Package purchase error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: `${API_URL}/api/payments/purchase`
    });
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

export const createReservation = async (mealType: string = 'DINNER', date?: Date, token?: string) => {
  try {
    console.log('Creating reservation for:', mealType);
    const response = await api.post('api/users/reservations', 
      { 
        mealType,
        date: date || new Date(),
      },
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

export default {
  getPackages,
  purchasePackage,
  purchaseCustomTickets,
  getUserTickets,
  createReservation
};
