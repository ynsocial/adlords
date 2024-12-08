import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../services/api';
import { Permission, RolePermissions } from '../utils/permissions';
import { io, Socket } from 'socket.io-client';

export type UserRole = 'admin' | 'company' | 'ambassador' | 'guest';

export type CompanyStatus = 'pending' | 'approved' | 'rejected';

interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  company?: Company;
  lastActivity?: Date;
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
  name: string;
  role: UserRole;
  company?: Omit<Company, 'id' | 'status'>;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithLinkedIn: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
  notifications: Notification[];
  clearNotifications: () => void;
  markNotificationAsRead: (id: string) => void;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

const getDefaultRoute = (role: UserRole): string => {
  const routes: Record<UserRole, string> = {
    admin: '/admin/dashboard',
    company: '/company/dashboard',
    ambassador: '/ambassador/dashboard',
    guest: '/',
  };
  return routes[role];
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  const setAuthState = useCallback((updates: Partial<AuthState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const validateToken = useCallback((token: string): boolean => {
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      const expiryTime = decoded.exp * 1000;
      return Date.now() < expiryTime;
    } catch {
      return false;
    }
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    setAuthState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    });
  }, [setAuthState]);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token || !validateToken(token)) {
        clearAuthData();
        return;
      }

      const user = await authApi.getCurrentUser();
      setAuthState({
        user,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
    } catch (error) {
      clearAuthData();
    }
  }, [validateToken, clearAuthData, setAuthState]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (state.user) {
      const newSocket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:4000', {
        auth: {
          token: localStorage.getItem(TOKEN_KEY),
        },
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connected');
      });

      newSocket.on('notification', (notification: Omit<Notification, 'id' | 'read'>) => {
        setNotifications(prev => [
          {
            ...notification,
            id: crypto.randomUUID(),
            read: false,
            createdAt: new Date(),
          },
          ...prev,
        ]);
      });

      newSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [state.user]);

  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    try {
      setAuthState({ loading: true, error: null });
      const { token, user } = await authApi.login(email, password);
      
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
      
      setAuthState({
        user,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
      
      navigate(getDefaultRoute(user.role));
    } catch (err: any) {
      setAuthState({
        loading: false,
        error: err.message || 'Login failed',
      });
      throw err;
    }
  }, [navigate, setAuthState]);

  const register = useCallback(async (data: RegistrationData) => {
    try {
      setAuthState({ loading: true, error: null });
      const { token, user } = await authApi.register(data);
      
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
      
      setAuthState({
        user,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
      
      navigate(getDefaultRoute(user.role));
    } catch (err: any) {
      setAuthState({
        loading: false,
        error: err.message || 'Registration failed',
      });
      throw err;
    }
  }, [navigate, setAuthState]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuthData();
      socket?.close();
      setSocket(null);
      setNotifications([]);
      navigate('/login');
    }
  }, [clearAuthData, navigate, socket]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    return state.user?.permissions.includes(permission) ?? false;
  }, [state.user]);

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!state.user) return false;
    return Array.isArray(role)
      ? role.includes(state.user.role)
      : state.user.role === role;
  }, [state.user]);

  const socialLogin = useCallback(async (provider: string) => {
    try {
      setAuthState({ loading: true, error: null });
      const { token, user } = await authApi.socialLogin(provider);
      
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
      
      setAuthState({
        user,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
      
      navigate(getDefaultRoute(user.role));
    } catch (err: any) {
      setAuthState({
        loading: false,
        error: err.message || `${provider} login failed`,
      });
      throw err;
    }
  }, [navigate, setAuthState]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const contextValue = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      loginWithGoogle: () => socialLogin('google'),
      loginWithFacebook: () => socialLogin('facebook'),
      loginWithLinkedIn: () => socialLogin('linkedin'),
      resetPassword: authApi.resetPassword,
      updatePassword: authApi.updatePassword,
      hasPermission,
      hasRole,
      refreshUser,
      notifications,
      clearNotifications,
      markNotificationAsRead,
    }),
    [state, login, register, logout, socialLogin, hasPermission, hasRole, refreshUser, notifications]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
