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
                       window.location.hostname.includes('preview');

  if (isDevelopment) {
    // In development, try to infer tenant from current branch data
    const currentBranchId = localStorage.getItem('currentBranchId');
    
    if (currentBranchId) {
      // Try to infer tenant from branch data in localStorage or fetch it
      // For now, get dev tenant from localStorage or redirect to branch selection
      let devTenant = localStorage.getItem('dev-tenant');
      
      if (devTenant) {
        const tenantAwarePath = `/${devTenant}${location.pathname}${location.search}${location.hash}`;
        console.log('[BranchDashboardRedirect] Redirecting to tenant-aware URL:', tenantAwarePath);
        return <Navigate to={tenantAwarePath} replace />;
      }
    }

    // If no proper tenant context, redirect to branch login
    console.warn('[BranchDashboardRedirect] No tenant context found, redirecting to branch login');
    return <Navigate to="/branch-admin-login" replace />;
  }

  // In production, we should have a proper tenant domain
  // This shouldn't happen in production as domains should be tenant-specific
  console.error('[BranchDashboardRedirect] Branch dashboard accessed without tenant in production');
  return <Navigate to="/" replace />;
};