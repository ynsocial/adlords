import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export type UserRole = 'admin' | 'ambassador';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { firstName?: string; lastName?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'auth_token';

export const getDefaultRoute = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'ambassador':
      return '/ambassador/dashboard';
    default:
      return '/';
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  // Configure axios
  axios.defaults.baseURL = API_URL;

  const setAuthToken = useCallback((token: string | null) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem(TOKEN_KEY);
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      setAuthToken(token);
      const response = await axios.get('/auth/profile');
      setState({
        user: response.data.data.user,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
    } catch (error) {
      setAuthToken(null);
      setState({
        user: null,
        loading: false,
        error: 'Session expired',
        isAuthenticated: false,
      });
    }
  }, [setAuthToken]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await axios.post('/auth/login', credentials);
      const { token, user } = response.data.data;
      setAuthToken(token);
      setState({
        user,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
      navigate(getDefaultRoute(user.role));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Login failed',
        loading: false,
      }));
      throw error;
    }
  };

  const register = async (data: RegistrationData) => {
    try {
      const response = await axios.post('/auth/register', data);
      const { token, user } = response.data.data;
      setAuthToken(token);
      setState({
        user,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
      navigate(getDefaultRoute(user.role));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Registration failed',
        loading: false,
      }));
      throw error;
    }
  };

  const logout = useCallback(() => {
    setAuthToken(null);
    setState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    });
    navigate('/login');
  }, [navigate, setAuthToken]);

  const updateProfile = async (data: { firstName?: string; lastName?: string }) => {
    try {
      const response = await axios.put('/auth/profile', data);
      setState(prev => ({
        ...prev,
        user: response.data.data.user,
        error: null,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Profile update failed',
      }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
