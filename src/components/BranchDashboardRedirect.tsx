import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingScreen } from '@/components/LoadingScreen';

/**
 * BranchDashboardRedirect - Redirects branch dashboard URLs to tenant-aware URLs
 * 
 * This component intercepts direct access to /branch-dashboard/* URLs and redirects
 * them to the proper tenant-aware format /{tenantSlug}/branch-dashboard/*
 */
export const BranchDashboardRedirect: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    console.log('[BranchDashboardRedirect] Intercepted non-tenant branch dashboard URL:', location.pathname);
  }, [location.pathname]);

  // Check if running in development mode
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' || 
                       window.location.hostname.includes('.lovableproject.com');

  if (isDevelopment) {
    // In development, try to get tenant from localStorage
    let devTenant = localStorage.getItem('dev-tenant');
    
    // If no dev tenant, set a default one for development using an existing tenant
    if (!devTenant) {
      devTenant = 'demo'; // Use an existing tenant slug from the database
      localStorage.setItem('dev-tenant', devTenant);
      console.log('[BranchDashboardRedirect] Set default dev tenant:', devTenant);
    }
    
    if (devTenant) {
      const tenantAwarePath = `/${devTenant}${location.pathname}${location.search}${location.hash}`;
      console.log('[BranchDashboardRedirect] Redirecting to tenant-aware URL:', tenantAwarePath);
      return <Navigate to={tenantAwarePath} replace />;
    }

    // If still no dev tenant, redirect to login with a warning
    console.warn('[BranchDashboardRedirect] No dev tenant found in localStorage, redirecting to main page');
    return <Navigate to="/" replace />;
  }

  // In production, we should have a proper tenant domain
  // This shouldn't happen in production as domains should be tenant-specific
  console.error('[BranchDashboardRedirect] Branch dashboard accessed without tenant in production');
  return <Navigate to="/" replace />;
};