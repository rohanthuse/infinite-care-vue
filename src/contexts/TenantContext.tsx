import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  billing_email?: string;
  subscription_status: string;
  subscription_plan: string;
  max_users: number;
  max_branches: number;
  settings: Record<string, any>;
}

interface TenantContextType {
  organization: Organization | null;
  subdomain: string | null;
  isLoading: boolean;
  error: Error | null;
  refreshOrganization: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [subdomain, setSubdomain] = useState<string | null>(null);

  // Extract tenant slug from URL path
  useEffect(() => {
    const pathname = window.location.pathname;
    console.log('[TenantProvider] Current pathname:', pathname);

    // Extract tenant slug from URL path (e.g., /hcl/dashboard -> hcl)
    const pathParts = pathname.split('/').filter(Boolean);
    console.log('[TenantProvider] Path parts:', pathParts);

    // Define system and public routes that don't require tenant resolution
    const systemRoutes = ['system', 'tenant-selection'];
    const publicRoutes = ['super-admin', 'branch-admin-login', 'branch-selection', 'carer-login', 'client-login', 'carer-invitation', 'carer-onboarding', 'tenant-setup', 'tenant-error', 'system-login', 'system-dashboard'];
    
    // Handle system routes (no tenant needed)
    if (pathParts.length > 0 && systemRoutes.includes(pathParts[0])) {
      console.log('[TenantProvider] System route detected - no tenant needed');
      setSubdomain(null);
      return;
    }
    
    // Handle tenant-specific login routes (e.g., /hcl/branch-admin-login)
    const isTenantLoginRoute = pathParts.length === 2 && publicRoutes.slice(1, 6).includes(pathParts[1]);
    if (isTenantLoginRoute) {
      console.log('[TenantProvider] Tenant-specific login route detected, setting tenant:', pathParts[0]);
      setSubdomain(pathParts[0]);
      return;
    }
    
    // Handle root and public routes
    if (pathParts.length === 0 || publicRoutes.includes(pathParts[0])) {
      console.log('[TenantProvider] Public route or root - no tenant');
      setSubdomain(null);
      return;
    }

    // For development, allow overriding tenant via localStorage (ONLY for localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const devTenant = localStorage.getItem('dev-tenant');
      if (devTenant && pathParts[0] !== 'system' && pathParts[0] !== 'tenant-selection') {
        console.log('[TenantProvider] Development mode - using tenant from localStorage:', devTenant);
        setSubdomain(devTenant);
        return;
      }
    }

    // First path segment should be the tenant slug
    const tenantSlug = pathParts[0]?.toLowerCase();
    console.log('[TenantProvider] Extracted tenant slug:', tenantSlug);
    setSubdomain(tenantSlug);
  }, [window.location.pathname]);

  // Fetch organization data
  const { 
    data: organization, 
    isLoading, 
    error, 
    refetch: refreshOrganization 
  } = useQuery({
    queryKey: ['organization', subdomain, user?.id],
    queryFn: async () => {
      if (!subdomain) {
        console.log('[TenantProvider] No subdomain - returning null');
        return null;
      }

      console.log('[TenantProvider] Fetching organization for subdomain:', subdomain);

      // Find organization by slug (try both slug and subdomain fields)
      let { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', subdomain)
        .maybeSingle();

      // If not found by slug, try subdomain field
      if (!orgData && !orgError) {
        const { data: orgBySubdomain, error: subdomainError } = await supabase
          .from('organizations')
          .select('*')
          .eq('subdomain', subdomain)
          .maybeSingle();
        
        orgData = orgBySubdomain;
        orgError = subdomainError;
      }

      if (orgError) {
        console.error('[TenantProvider] Error fetching organization:', orgError);
        throw orgError;
      }

      if (!orgData) {
        console.error('[TenantProvider] Organization not found for subdomain:', subdomain);
        throw new Error(`Organization "${subdomain}" not found. Please check the URL or contact your administrator.`);
      }

      console.log('[TenantProvider] Found organization:', orgData);

      // Check if we're on a login route - skip membership check for these
      const pathname = window.location.pathname;
      const pathParts = pathname.split('/').filter(Boolean);
      const loginRoutes = ['branch-admin-login', 'carer-login', 'client-login', 'carer-invitation', 'carer-onboarding'];
      const isOnLoginRoute = pathParts.length === 2 && loginRoutes.includes(pathParts[1]);
      
      console.log('[TenantProvider] Current route check - pathname:', pathname, 'isOnLoginRoute:', isOnLoginRoute);

      // If a user is logged in AND we're not on a login route, verify membership for protected access
      if (user && !isOnLoginRoute) {
        console.log('[TenantProvider] Performing membership check for authenticated user on protected route');
        
        // Check if user is a super admin; if so, bypass org membership requirement
        const { data: roleRows, error: roleErr } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (roleErr) {
          console.warn('[TenantProvider] Failed to fetch roles, proceeding with membership check:', roleErr);
        }

        const isSuperAdmin = (roleRows || []).some(r => r.role === 'super_admin');

        if (!isSuperAdmin) {
          // Require active membership for non-super admins
          const { error: memberError } = await supabase
            .from('organization_members')
            .select('id')
            .eq('organization_id', orgData.id)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

          if (memberError) {
            console.error('[TenantProvider] User is not a member of this organization:', memberError);
            throw new Error('Access denied: You are not a member of this organization');
          }
        } else {
          console.log('[TenantProvider] Super admin detected; bypassing org membership check.');
        }
      } else if (isOnLoginRoute) {
        console.log('[TenantProvider] On login route - skipping membership check');
      }

      return orgData as Organization;
    },
    enabled: subdomain !== null,
    retry: 1,
  });

  // Apply organization branding to CSS custom properties
  useEffect(() => {
    if (organization) {
      const root = document.documentElement;
      root.style.setProperty('--primary', organization.primary_color);
      root.style.setProperty('--secondary', organization.secondary_color);
      
      // Update document title to include organization name
      document.title = `${organization.name} - Care Management System`;
    }
  }, [organization]);

  const value: TenantContextType = {
    organization,
    subdomain,
    isLoading,
    error: error as Error | null,
    refreshOrganization,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
