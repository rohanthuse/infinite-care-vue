import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { validateBranchInOrganization } from './useTenantAware';
import { useState, useCallback, useMemo } from 'react';

export interface EnhancedStaff {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  status: string;
  specialization?: string;
  availability?: string;
  full_name: string;
  search_text: string;
}

interface SearchableStaffParams {
  branchId: string;
  searchTerm?: string;
  staffStatus?: 'all' | 'active' | 'inactive';
  limit?: number;
  offset?: number;
}

const fetchSearchableStaff = async ({
  branchId,
  searchTerm = '',
  staffStatus = 'all',
  limit = 20,
  offset = 0
}: SearchableStaffParams): Promise<{ staff: EnhancedStaff[]; totalCount: number }> => {
  let query = supabase
    .from('staff')
    .select('id, first_name, last_name, email, phone, status, specialization, availability', { count: 'exact' })
    .eq('branch_id', branchId);

  // Filter by status
  if (staffStatus === 'active') {
    query = query.eq('status', 'Active');
  } else if (staffStatus === 'inactive') {
    query = query.neq('status', 'Active');
  }

  // Search functionality
  if (searchTerm) {
    query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,specialization.ilike.%${searchTerm}%`);
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  // Order by name
  query = query.order('first_name');

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }

  const enhancedStaff: EnhancedStaff[] = (data || []).map(staff => ({
    ...staff,
    full_name: `${staff.first_name} ${staff.last_name}`.trim(),
    search_text: `${staff.first_name} ${staff.last_name} ${staff.email || ''} ${staff.specialization || ''}`.toLowerCase()
  }));

  return {
    staff: enhancedStaff,
    totalCount: count || 0
  };
};

export const useSearchableStaff = (branchId: string) => {
  const { organization } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [staffStatus, setStaffStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [page, setPage] = useState(0);
  const limit = 20;

  const queryParams = useMemo(() => ({
    branchId,
    searchTerm: searchTerm.trim(),
    staffStatus,
    limit,
    offset: page * limit
  }), [branchId, searchTerm, staffStatus, page, limit]);

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['searchable-staff', queryParams, organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error('Organization context required');
      }
      
      // Validate branch belongs to organization
      const isValidBranch = await validateBranchInOrganization(branchId, organization.id);
      if (!isValidBranch) {
        throw new Error('Branch does not belong to current organization');
      }

      return fetchSearchableStaff(queryParams);
    },
    enabled: Boolean(branchId) && Boolean(organization?.id),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Client-side filtering for immediate feedback
  const staff = data?.staff || [];
  const totalCount = data?.totalCount || 0;

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const previousPage = useCallback(() => {
    setPage(prev => Math.max(0, prev - 1));
  }, []);

  const resetPage = useCallback(() => {
    setPage(0);
  }, []);

  const hasNextPage = (page + 1) * limit < totalCount;
  const hasPreviousPage = page > 0;

  return {
    staff,
    totalCount,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    staffStatus,
    setStaffStatus,
    page,
    nextPage,
    previousPage,
    resetPage,
    hasNextPage,
    hasPreviousPage,
    refetch
  };
};

export const useRecentStaff = (branchId: string) => {
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['recent-staff', branchId, organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error('Organization context required');
      }
      
      // Validate branch belongs to organization
      const isValidBranch = await validateBranchInOrganization(branchId, organization.id);
      if (!isValidBranch) {
        throw new Error('Branch does not belong to current organization');
      }

      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, phone, status, specialization, availability')
        .eq('branch_id', branchId)
        .eq('status', 'Active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent staff:', error);
        throw error;
      }

      const enhancedStaff: EnhancedStaff[] = (data || []).map(staff => ({
        ...staff,
        full_name: `${staff.first_name} ${staff.last_name}`.trim(),
        search_text: `${staff.first_name} ${staff.last_name} ${staff.email || ''} ${staff.specialization || ''}`.toLowerCase()
      }));

      return enhancedStaff;
    },
    enabled: Boolean(branchId) && Boolean(organization?.id),
  });
};