import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * TenantFetcher - Fetches tenant slug for authenticated user
 */
const TenantFetcher: React.FC<{ onTenantFound: (slug: string) => void }> = ({ onTenantFound }) => {
  const { user } = useAuthSafe();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!user?.id) {
        setError('No authenticated user');
        return;
      }

      console.log('[TenantFetcher] Fetching tenant for user:', user.id);

      // First get the staff record
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, branch_id')
        .eq('auth_user_id', user.id)
        .single();

      if (staffError || !staffData?.branch_id) {
        console.error('[TenantFetcher] Error fetching staff:', staffError);
        setError('Could not find your staff profile');
        return;
      }

      // Then get the branch and organization
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('organization_id')
        .eq('id', staffData.branch_id)
        .single();

      if (branchError || !branchData?.organization_id) {
        console.error('[TenantFetcher] Error fetching branch:', branchError);
        setError('Could not find your organization');
        return;
      }

      // Finally get the organization slug
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', branchData.organization_id)
        .single();

      if (orgError || !orgData?.slug) {
        console.error('[TenantFetcher] Error fetching organization:', orgError);
        setError('No organization found for your account');
        return;
      }

      const tenantSlug = orgData.slug;
      console.log('[TenantFetcher] Found tenant:', tenantSlug);
      localStorage.setItem('dev-tenant', tenantSlug);
      onTenantFound(tenantSlug);
    };

    fetchTenant();
  }, [user?.id, onTenantFound]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Unable to Access Dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.href = '/login'}>
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return <LoadingScreen />;
};

/**
 * CarerDashboardRedirect - Redirects carer dashboard URLs to tenant-aware URLs
 * 
 * This component intercepts direct access to /carer-dashboard/* URLs and redirects
 * them to the proper tenant-aware format /{tenantSlug}/carer-dashboard/*
 */
export const CarerDashboardRedirect: React.FC = () => {
  const location = useLocation();
  const [fetchedTenant, setFetchedTenant] = useState<string | null>(null);

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

    // If tenant was fetched, redirect with it
    if (fetchedTenant) {
      const tenantAwarePath = `/${fetchedTenant}${location.pathname}${location.search}${location.hash}`;
      console.log('[CarerDashboardRedirect] Redirecting with fetched tenant:', tenantAwarePath);
      return <Navigate to={tenantAwarePath} replace />;
    }

    // Try to fetch tenant from database
    console.warn('[CarerDashboardRedirect] No dev tenant in localStorage, fetching from database');
    return <TenantFetcher onTenantFound={setFetchedTenant} />;
  }

  // In production, we should have a proper tenant domain
  // This shouldn't happen in production as domains should be tenant-specific
  console.error('[CarerDashboardRedirect] Carer dashboard accessed without tenant in production');
  return <Navigate to="/login" replace />;
};