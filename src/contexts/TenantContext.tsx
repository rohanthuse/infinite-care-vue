
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from '@/hooks/useAuthSafe';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  subscription_status: string;
}

interface TenantContextType {
  organization: Organization | null;
  tenantSlug: string | null;
  isLoading: boolean;
  error: string | null;
  refreshOrganization: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user, loading: authLoading } = useAuthSafe();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = async () => {
    if (!tenantSlug || !user) {
      setOrganization(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const fetchStartTime = performance.now();
    console.log('[TenantProvider] Fetching organization for tenant:', tenantSlug);

    try {
      // Step 1: Get organization by slug
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug, subscription_plan, subscription_status')
        .eq('slug', tenantSlug)
        .maybeSingle();

      if (orgError) {
        console.error('[TenantProvider] Error fetching organization:', orgError);
        setError('Failed to load organization');
        return;
      }

      if (!orgData) {
        console.log('[TenantProvider] Organization not found for slug:', tenantSlug);
        setError('Organization not found');
        return;
      }

      const orgFetchTime = performance.now();
      console.log(`[TenantProvider] Organization fetched in ${orgFetchTime - fetchStartTime}ms`);

      // Step 2: Check user access using unified RPC
      console.log('[TenantProvider] Checking user access to organization...');
      
      const { data: hasAccess, error: accessError } = await supabase
        .rpc('user_has_access_to_org', {
          p_user_id: user.id,
          p_organization_id: orgData.id
        });

      const accessCheckTime = performance.now();
      console.log(`[TenantProvider] Access check completed in ${accessCheckTime - orgFetchTime}ms`);

      if (accessError) {
        console.error('[TenantProvider] Error checking access:', accessError);
        setError('Failed to verify access');
        return;
      }

      if (!hasAccess) {
        console.log('[TenantProvider] User does not have access to organization:', tenantSlug);
        setError('You do not have access to this organization');
        return;
      }

      console.log('[TenantProvider] User has access, setting organization:', orgData.name);
      setOrganization(orgData);

      const totalTime = performance.now();
      console.log(`[TenantProvider] Total tenant setup time: ${totalTime - fetchStartTime}ms`);

    } catch (error: any) {
      console.error('[TenantProvider] Unexpected error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchOrganization();
    }
  }, [tenantSlug, user, authLoading]);

  const refreshOrganization = () => {
    fetchOrganization();
  };

  return (
    <TenantContext.Provider
      value={{
        organization,
        tenantSlug: tenantSlug || null,
        isLoading: isLoading || authLoading,
        error,
        refreshOrganization,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
