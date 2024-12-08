import axios, { AxiosError } from 'axios';
import { AuthResponse, ApiError, AmbassadorProfile, Task } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: error.response?.data?.error || 'An unexpected error occurred',
      status: error.response?.status,
    };

    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(apiError);
  }
);

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  register: async (userData: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  getProfile: async (): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>('/auth/profile');
    return response.data;
  },
};

export const ambassadorApi = {
  getAmbassadors: async (filters: {
    page: number;
    limit: number;
    category?: string;
    search?: string;
  }) => {
    const response = await api.get('/ambassadors', { params: filters });
    return response.data;
  },

  getAmbassadorProfile: async (id: string) => {
    const response = await api.get(`/ambassadors/${id}`);
    return response.data;
  },

  createAmbassadorProfile: async (data: Partial<AmbassadorProfile>) => {
    const response = await api.post('/ambassadors', data);
    return response.data;
  },

  updateAmbassadorProfile: async (id: string, data: Partial<AmbassadorProfile>) => {
    const response = await api.put(`/ambassadors/${id}`, data);
    return response.data;
  },

  deleteAmbassadorProfile: async (id: string) => {
    const response = await api.delete(`/ambassadors/${id}`);
    return response.data;
  },

  getAmbassadorStats: async (id: string) => {
    const response = await api.get(`/ambassadors/${id}/stats`);
    return response.data;
  },
};

export const profileApi = {
  getCurrentUser: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/profile', data);
    return response.data;
  },

  updatePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.put('/profile/password', data);
    return response.data;
  },
};

export const taskApi = {
  getTasks: async (filters: {
    page: number;
    limit: number;
    status?: string;
    type?: string;
    ambassadorId?: string;
  }) => {
    const response = await api.get('/tasks', { params: filters });
    return response.data;
  },

  getTask: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (data: Partial<Task>) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  updateTask: async (id: string, data: Partial<Task>) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  updateTaskStatus: async (id: string, status: Task['status']) => {
    const response = await api.put(`/tasks/${id}/status`, { status });
    return response.data;
  },
};

export const analyticsApi = {
  getDashboardStats: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getAmbassadorPerformance: async (period: string) => {
    const response = await api.get('/analytics/ambassadors', {
      params: { period },
    });
    return response.data;
  },

  getReferralStats: async (filters: {
    startDate?: string;
    endDate?: string;
    ambassadorId?: string;
  }) => {
    const response = await api.get('/analytics/referrals', {
      params: filters,
    });
    return response.data;
  },

  getServicePerformance: async (period: string) => {
    const response = await api.get('/analytics/services', {
      params: { period },
    });
    return response.data;
  },

  getRevenueStats: async (period: string) => {
    const response = await api.get('/analytics/revenue', {
      params: { period },
    });
    return response.data;
  },
};

export default api;
