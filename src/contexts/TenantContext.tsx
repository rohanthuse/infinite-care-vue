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

  // Fetch organization data with optimized access checking
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

      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

      try {
        // Find organization by slug
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', tenantSlug)
          .abortSignal(controller.signal)
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

        // If a user is logged in, use optimized access verification
        if (user) {
          console.log('[TenantProvider] Verifying user access to organization');
          
          // Use the optimized RPC function for access checking with timeout
          const accessController = new AbortController();
          const accessTimeoutId = setTimeout(() => accessController.abort(), 3000); // 3-second timeout
          
          try {
            const { data: hasAccess, error: accessError } = await supabase
              .rpc('user_has_access_to_org', {
                user_id_param: user.id,
                org_id_param: orgData.id
              })
              .abortSignal(accessController.signal)
              .single();

            clearTimeout(accessTimeoutId);

            if (accessError) {
              console.warn('[TenantProvider] Access check failed:', accessError);
              // Fallback: allow access if access check fails (don't block user)
              console.log('[TenantProvider] Access check failed, allowing access as fallback');
            } else if (!hasAccess) {
              console.error('[TenantProvider] User does not have access to this organization');
              throw new Error('Access denied: You are not authorized to access this organization');
            } else {
              console.log('[TenantProvider] User access verified successfully');
            }
          } catch (accessCheckError) {
            clearTimeout(accessTimeoutId);
            if (accessCheckError.name === 'AbortError') {
              console.warn('[TenantProvider] Access check timed out, allowing access as fallback');
            } else {
              console.warn('[TenantProvider] Access check error, allowing access as fallback:', accessCheckError);
            }
            // Don't throw - allow access as fallback to prevent infinite loops
          }
        }

        clearTimeout(timeoutId);
        return orgData as Organization;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Organization fetch timed out - please try again');
        }
        throw fetchError;
      }
    },
    enabled: tenantSlug !== null,
    retry: (failureCount, error) => {
      // Don't retry timeout errors or access denied errors
      if (error.message.includes('timed out') || error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 1; // Only retry once
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
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
