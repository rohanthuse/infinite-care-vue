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
      // For development, check for a stored subdomain or use default
      const devSubdomain = localStorage.getItem('dev-subdomain') || 'demo';
      setSubdomain(devSubdomain);
      return;
    }

    // Extract subdomain from production hostname
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      setSubdomain(parts[0]);
    } else {
      // Default subdomain if none found
      setSubdomain('demo');
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
      if (!user || !subdomain) return null;

      // First, try to find organization by subdomain
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('subdomain', subdomain)
        .single();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
        throw orgError;
      }

      // Verify user is a member of this organization
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgData.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (memberError) {
        console.error('User is not a member of this organization:', memberError);
        throw new Error('Access denied: You are not a member of this organization');
      }

      return orgData as Organization;
    },
    enabled: !!user && !!subdomain,
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