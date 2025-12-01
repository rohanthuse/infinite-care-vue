import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Tenant status constants
 */
export const TENANT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
} as const;

export type TenantStatus = typeof TENANT_STATUS[keyof typeof TENANT_STATUS];

/**
 * Result of tenant status validation
 */
export interface TenantStatusCheckResult {
  isAllowed: boolean;
  status: string;
  message: string;
}

/**
 * Check if a tenant status allows login
 * @param subscriptionStatus - The organization's subscription_status field
 * @returns Object indicating if login is allowed and appropriate message
 */
export const checkTenantStatus = (subscriptionStatus: string): TenantStatusCheckResult => {
  if (subscriptionStatus === TENANT_STATUS.INACTIVE) {
    return {
      isAllowed: false,
      status: 'inactive',
      message: 'Your organisation is currently inactive. Please contact your organisation administrator for assistance.'
    };
  }
  
  if (subscriptionStatus === TENANT_STATUS.SUSPENDED) {
    return {
      isAllowed: false,
      status: 'suspended',
      message: 'Your organisation has been suspended. Please contact your organisation administrator for assistance.'
    };
  }
  
  return {
    isAllowed: true,
    status: subscriptionStatus,
    message: ''
  };
};

/**
 * Fetch organization status from database
 * @param supabase - Supabase client instance
 * @param organizationId - The organization ID to check
 * @returns The organization's subscription status
 */
export const fetchOrganizationStatus = async (
  supabase: SupabaseClient,
  organizationId: string
): Promise<string> => {
  const { data, error } = await supabase
    .from('organizations')
    .select('subscription_status')
    .eq('id', organizationId)
    .single();
    
  if (error) {
    throw new Error('Failed to verify organisation status');
  }
  
  return data?.subscription_status || 'active';
};

/**
 * Fetch organization status by slug
 * @param supabase - Supabase client instance
 * @param slug - The organization slug to check
 * @returns The organization's subscription status
 */
export const fetchOrganizationStatusBySlug = async (
  supabase: SupabaseClient,
  slug: string
): Promise<string> => {
  const { data, error } = await supabase
    .from('organizations')
    .select('subscription_status')
    .eq('slug', slug)
    .single();
    
  if (error) {
    throw new Error('Failed to verify organisation status');
  }
  
  return data?.subscription_status || 'active';
};
