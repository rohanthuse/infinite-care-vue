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

  // Extract subdomain from hostname
  useEffect(() => {
    const hostname = window.location.hostname;

    // Handle localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // For development, allow overriding subdomain via localStorage
      const devSubdomain = localStorage.getItem('dev-subdomain');
      setSubdomain(devSubdomain || null);
      return;
    }

    // Extract subdomain (supports med-infinite.care and other custom domains)
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const sd = parts[0]?.toLowerCase();
      // Ignore common non-tenant subdomains
      if (sd === 'www') {
        setSubdomain(null);
      } else {
        setSubdomain(sd);
      }
    } else {
      // Root domain (no tenant)
      setSubdomain(null);
    }
  }, []);

  // Fetch organization data
  const { 
    data: organization, 
    isLoading, 
    error, 
    refetch: refreshOrganization 
  } = useQuery({
    queryKey: ['organization', subdomain, user?.id],
    queryFn: async () => {
      if (!subdomain) return null;

      // Find organization by subdomain
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('subdomain', subdomain)
        .single();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
        if (orgError.code === 'PGRST116') {
          throw new Error(`Organization with subdomain "${subdomain}" not found`);
        }
        throw orgError;
      }

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
          // Require active membership for non-super admins
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
        } else {
          console.log('[TenantProvider] Super admin detected; bypassing org membership check.');
        }
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
