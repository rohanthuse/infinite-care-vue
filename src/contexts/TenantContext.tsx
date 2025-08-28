import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { normalizeToHslVar } from '@/lib/colors';

interface Organization {
  id: string;
  name: string;
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
  tenantSlug: string | null;
  isLoading: boolean;
  error: Error | null;
  refreshOrganization: () => void;
}

export const TenantContext = createContext<TenantContextType | undefined>(undefined);

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
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  // Extract tenant slug from URL path
  useEffect(() => {
    const pathname = window.location.pathname;
    console.log('[TenantProvider] Current pathname:', pathname);

    // Extract tenant slug from URL path (e.g., /hcl/dashboard -> hcl)
    const pathParts = pathname.split('/').filter(Boolean);
    console.log('[TenantProvider] Path parts:', pathParts);

    // Skip system routes and public routes that should not be treated as tenant slugs
    const publicRoutes = [
      'super-admin', 'branch-admin-login', 'branch-selection', 'carer-login', 
      'client-login', 'carer-invitation', 'carer-onboarding', 'tenant-setup', 
      'tenant-error', 'system-login', 'system-dashboard'
    ];
    
    // Also skip standalone routes that might conflict with tenant slugs
    const standaloneRoutes = [
      'services', 'settings', 'dashboard', 'agreement', 'hobbies', 'skills',
      'medical-mental', 'type-of-work', 'body-map-points', 'branch', 'branch-admins', 'notifications'
    ];
    
    if (pathParts.length === 0 || publicRoutes.includes(pathParts[0]) || standaloneRoutes.includes(pathParts[0])) {
      console.log('[TenantProvider] Public route, standalone route, or root - no tenant');
      setTenantSlug(null);
      return;
    }

    // First path segment should be the tenant slug
    const extractedSlug = pathParts[0]?.toLowerCase();
    console.log('[TenantProvider] Extracted tenant slug:', extractedSlug);
    
    // If we have a URL tenant slug, use it and update localStorage for consistency
    if (extractedSlug) {
      setTenantSlug(extractedSlug);
      
      // Update dev-tenant in localStorage for development consistency
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('preview')) {
        localStorage.setItem('dev-tenant', extractedSlug);
      }
      return;
    }
    
    // For development, fall back to localStorage tenant if no URL tenant
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('preview')) {
      const devTenant = localStorage.getItem('dev-tenant');
      if (devTenant) {
        console.log('[TenantProvider] Development mode - using tenant from localStorage:', devTenant);
        setTenantSlug(devTenant);
        return;
      }
    }
    
    // No tenant slug found
    setTenantSlug(null);
  }, [window.location.pathname]);

  // Fetch organization data
  const { 
    data: organization, 
    isLoading, 
    error, 
    refetch: refreshOrganization 
  } = useQuery({
    queryKey: ['organization', tenantSlug, user?.id],
    queryFn: async () => {
      if (!tenantSlug) {
        console.log('[TenantProvider] No tenant slug - returning null');
        return null;
      }

      console.log('[TenantProvider] Fetching organization for slug:', tenantSlug);

      // Find organization by slug
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', tenantSlug)
        .maybeSingle();

      if (orgError) {
        console.error('[TenantProvider] Error fetching organization:', orgError);
        throw orgError;
      }

      if (!orgData) {
        console.error('[TenantProvider] Organization not found for slug:', tenantSlug);
        throw new Error(`Organization with slug "${tenantSlug}" not found`);
      }

      console.log('[TenantProvider] Found organization:', orgData);

      // If a user is logged in, verify membership for protected access
      if (user) {
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
          // Check user role type for specific verification logic
          const isClient = (roleRows || []).some(r => r.role === 'client');
          const isCarer = (roleRows || []).some(r => r.role === 'carer');
          
          if (isClient) {
            // For clients, verify access through their branch-organization relationship
            const { error: clientAccessError } = await supabase
              .from('clients')
              .select('branch_id, branches!inner(organization_id)')
              .eq('auth_user_id', user.id)
              .eq('branches.organization_id', orgData.id)
              .single();

            if (clientAccessError) {
              console.error('Client does not belong to this organization:', clientAccessError);
              throw new Error('Access denied: You are not authorized to access this organization');
            }
            
            console.log('[TenantProvider] Client access verified through branch relationship');
          } else if (isCarer) {
            // For carers, verify access through their staff-branch-organization relationship
            const { error: carerAccessError } = await supabase
              .from('staff')
              .select('branch_id, branches!inner(organization_id)')
              .eq('auth_user_id', user.id)
              .eq('branches.organization_id', orgData.id)
              .eq('status', 'Active')
              .single();

            if (carerAccessError) {
              console.error('Carer does not belong to this organization:', carerAccessError);
              throw new Error('Access denied: You are not authorized to access this organization');
            }
            
            console.log('[TenantProvider] Carer access verified through staff-branch relationship');
          } else {
            // For other user types (admins, etc.), check organization_members table
            const { error: memberError } = await supabase
              .from('organization_members')
              .select('id')
              .eq('organization_id', orgData.id)
              .eq('user_id', user.id)
              .eq('status', 'active')
              .single();

            if (memberError) {
              console.error('User is not a member of this organization:', memberError);
              throw new Error('Access denied: You are not a member of this organization');
            }
          }
        } else {
          console.log('[TenantProvider] Super admin detected; bypassing org membership check.');
        }
      }

      return orgData as Organization;
    },
    enabled: tenantSlug !== null,
    retry: 1,
  });

  // Apply organization branding to CSS custom properties
  useEffect(() => {
    if (organization) {
      const root = document.documentElement;
      
      try {
        // Normalize colors to HSL format for CSS custom properties
        const primaryHsl = normalizeToHslVar(organization.primary_color);
        const secondaryHsl = normalizeToHslVar(organization.secondary_color);
        
        root.style.setProperty('--primary', primaryHsl);
        root.style.setProperty('--secondary', secondaryHsl);
      } catch (error) {
        console.error('Error applying organization colors:', error);
        // Fallback to default colors if normalization fails
        root.style.setProperty('--primary', '222.2 84% 4.9%');
        root.style.setProperty('--secondary', '210 40% 96%');
      }
      
      // Update document title to include organization name
      document.title = `${organization.name} - Care Management System`;
    }
  }, [organization]);

  const value: TenantContextType = {
    organization,
    tenantSlug,
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
