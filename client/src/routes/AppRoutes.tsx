import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

// Admin Routes
import AdminDashboard from '../components/admin/AdminDashboard';
import AmbassadorManagement from '../components/admin/AmbassadorManagement';
import CompanyManagement from '../components/admin/CompanyManagement';
import JobManagement from '../components/admin/JobManagement';
import AdminAnalytics from '../components/admin/AdminAnalytics';

// Company Routes
import CompanyDashboard from '../components/company/CompanyDashboard';
import JobPosting from '../components/company/JobPosting';
import CompanyAnalytics from '../components/company/CompanyAnalytics';
import ApplicationReview from '../components/company/ApplicationReview';

// Ambassador Routes
import AmbassadorDashboard from '../components/ambassador/AmbassadorDashboard';
import JobSearch from '../components/ambassador/JobSearch';
import ApplicationHistory from '../components/ambassador/ApplicationHistory';
import PerformanceMetrics from '../components/ambassador/PerformanceMetrics';

// Auth Routes
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import ForgotPassword from '../components/auth/ForgotPassword';
import SocialLogin from '../components/auth/SocialLogin';

// Shared Components
import Profile from '../components/shared/Profile';
import Settings from '../components/shared/Settings';
import NotFound from '../components/shared/NotFound';

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/:provider" element={<SocialLogin />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route path="ambassadors" element={<AmbassadorManagement />} />
        <Route path="companies" element={<CompanyManagement />} />
        <Route path="jobs" element={<JobManagement />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      {/* Company Routes */}
      <Route
        path="/company"
        element={
          <ProtectedRoute requiredRole="company">
            <CompanyDashboard />
          </ProtectedRoute>
        }
      >
        <Route path="jobs/new" element={<JobPosting />} />
        <Route path="jobs/:jobId/edit" element={<JobPosting />} />
        <Route path="applications" element={<ApplicationReview />} />
        <Route path="analytics" element={<CompanyAnalytics />} />
      </Route>

      {/* Ambassador Routes */}
      <Route
        path="/ambassador"
        element={
          <ProtectedRoute requiredRole="ambassador">
            <AmbassadorDashboard />
          </ProtectedRoute>
        }
      >
        <Route path="jobs" element={<JobSearch />} />
        <Route path="applications" element={<ApplicationHistory />} />
        <Route path="performance" element={<PerformanceMetrics />} />
      </Route>

      {/* Shared Protected Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Root Redirect */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={`/${user.role.toLowerCase()}`}
              replace
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
