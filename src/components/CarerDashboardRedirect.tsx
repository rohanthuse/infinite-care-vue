import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingScreen } from '@/components/LoadingScreen';

/**
 * CarerDashboardRedirect - Redirects carer dashboard URLs to tenant-aware URLs
 * 
 * This component intercepts direct access to /carer-dashboard/* URLs and redirects
 * them to the proper tenant-aware format /{tenantSlug}/carer-dashboard/*
 */
export const CarerDashboardRedirect: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    console.log('[CarerDashboardRedirect] Intercepted non-tenant carer dashboard URL:', location.pathname);
  }, [location.pathname]);

  // Check if running in development mode
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' || 
                       window.location.hostname.includes('preview');

  if (isDevelopment) {
    // In development, try to get tenant from localStorage
    const devTenant = localStorage.getItem('dev-tenant');
    
    if (devTenant) {
      const tenantAwarePath = `/${devTenant}${location.pathname}${location.search}${location.hash}`;
      console.log('[CarerDashboardRedirect] Redirecting to tenant-aware URL:', tenantAwarePath);
      return <Navigate to={tenantAwarePath} replace />;
    }

    // If no dev tenant, redirect to carer login
    console.warn('[CarerDashboardRedirect] No dev tenant found in localStorage, redirecting to carer login');
    return <Navigate to="/carer-login" replace />;
  }

  // In production, we should have a proper tenant domain
  // This shouldn't happen in production as domains should be tenant-specific
  console.error('[CarerDashboardRedirect] Carer dashboard accessed without tenant in production');
  return <Navigate to="/" replace />;
};