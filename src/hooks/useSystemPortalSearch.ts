import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export interface SystemPortalSearchResult {
  tenants: Array<{
    id: string;
    name: string;
    slug: string;
    subscription_plan: string;
    status: string;
  }>;
  users: Array<{
    id: string;
    email: string;
    name: string;
    is_active: boolean;
    tenant_name: string;
  }>;
  agreements: Array<{
    id: string;
    title: string;
    status: string;
    tenant_name: string;
  }>;
  subscriptions: Array<{
    id: string;
    name: string;
    price_monthly: number;
    is_active: boolean;
  }>;
  isLoading: boolean;
  totalResults: number;
}

export function useSystemPortalSearch(searchTerm: string): SystemPortalSearchResult {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce search term (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search tenants
  const { data: tenants = [], isLoading: loadingTenants } = useQuery({
    queryKey: ['system-portal-search-tenants', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          subscription_status,
          subscription_plan
        `)
        .or(`name.ilike.%${debouncedSearchTerm}%,slug.ilike.%${debouncedSearchTerm}%,contact_email.ilike.%${debouncedSearchTerm}%`)
        .limit(10);

      if (error) throw error;
      
      return data.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        subscription_plan: org.subscription_plan || 'No Plan',
        status: org.subscription_status
      }));
    },
    enabled: debouncedSearchTerm.length >= 2,
  });

  // Search users
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['system-portal-search-users', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from('system_users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          is_active,
          system_user_organizations(
            organization:organizations(name)
          )
        `)
        .or(`email.ilike.%${debouncedSearchTerm}%,first_name.ilike.%${debouncedSearchTerm}%,last_name.ilike.%${debouncedSearchTerm}%`)
        .limit(10);

      if (error) throw error;
      
      return data.map(user => ({
        id: user.id,
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        is_active: user.is_active,
        tenant_name: (user.system_user_organizations as any)?.[0]?.organization?.name || 'No Tenant'
      }));
    },
    enabled: debouncedSearchTerm.length >= 2,
  });

  // Search agreements
  const { data: agreements = [], isLoading: loadingAgreements } = useQuery({
    queryKey: ['system-portal-search-agreements', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from('system_tenant_agreements')
        .select(`
          id,
          title,
          status,
          tenant:organizations(name)
        `)
        .or(`title.ilike.%${debouncedSearchTerm}%,agreement_reference.ilike.%${debouncedSearchTerm}%`)
        .limit(10);

      if (error) throw error;
      
      return data.map(agreement => ({
        id: agreement.id,
        title: agreement.title,
        status: agreement.status,
        tenant_name: (agreement.tenant as any)?.name || 'No Tenant'
      }));
    },
    enabled: debouncedSearchTerm.length >= 2,
  });

  // Search subscription plans
  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['system-portal-search-subscriptions', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, price_monthly, is_active')
        .or(`name.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`)
        .limit(10);

      if (error) throw error;
      
      return data.map(plan => ({
        id: plan.id,
        name: plan.name,
        price_monthly: plan.price_monthly,
        is_active: plan.is_active ?? true
      }));
    },
    enabled: debouncedSearchTerm.length >= 2,
  });

  const isLoading = loadingTenants || loadingUsers || loadingAgreements || loadingSubscriptions;
  const totalResults = tenants.length + users.length + agreements.length + subscriptions.length;

  return {
    tenants,
    users,
    agreements,
    subscriptions,
    isLoading,
    totalResults
  };
}
