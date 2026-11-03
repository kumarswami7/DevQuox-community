import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { PRE_LAUNCH_CONFIG } from '../../utils/preLaunchConfig';

export const ProtectedRoute = ({ allowedRoles = null, children = null }) => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading, isInitialized, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!isInitialized && localStorage.getItem('token')) {
      checkAuth();
    }
  }, [isInitialized, checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Verifying your workspace session...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if unauthenticated
  if (!isAuthenticated && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Pre-Launch Holding Gate: If pre-launch is active, keep users at /pre-launch
  if (PRE_LAUNCH_CONFIG.isPreLaunchActive(user) && location.pathname !== '/pre-launch') {
    return <Navigate to="/pre-launch" replace />;
  }

  // Role-based authorization guard
  if (allowedRoles && allowedRoles.length > 0 && user?.role) {
    const hasRole = allowedRoles.map(r => r.toLowerCase()).includes(user.role.toLowerCase());
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
