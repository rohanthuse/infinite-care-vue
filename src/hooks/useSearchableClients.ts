import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useState, useCallback } from 'react';

export interface EnhancedClient {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  pin_code?: string;
  address?: string;
  status?: string;
  active_from?: string;
  active_until?: string;
  full_name: string;
  search_text: string;
}

interface SearchableClientsParams {
  branchId: string;
  searchTerm?: string;
  clientStatus?: 'all' | 'active' | 'former';
  limit?: number;
  offset?: number;
}

const fetchSearchableClients = async ({
  branchId,
  searchTerm = '',
  clientStatus = 'all',
  limit = 100,
  offset = 0
}: SearchableClientsParams): Promise<{ clients: EnhancedClient[]; totalCount: number }> => {
  console.log('[fetchSearchableClients] Fetching clients:', { branchId, searchTerm, clientStatus, limit, offset });

  if (!branchId) return { clients: [], totalCount: 0 };

  let query = supabase
    .from('clients')
    .select('id, first_name, last_name, email, pin_code, address, status, active_from, active_until', { count: 'exact' })
    .eq('branch_id', branchId);

  // Apply status filter - also check active_until for active clients
  if (clientStatus !== 'all') {
    const statusValue = clientStatus === 'active' ? 'Active' : 'Former';
    query = query.eq('status', statusValue);
    
    // For active clients, also exclude those whose active_until has passed
    if (clientStatus === 'active') {
      const today = new Date().toISOString().split('T')[0];
      query = query.or(`active_until.is.null,active_until.gte.${today}`);
    }
  }

  // Apply search filter if searchTerm is provided
  if (searchTerm && searchTerm.trim().length > 0) {
    const term = searchTerm.trim();
    query = query.or(`
      first_name.ilike.%${term}%,
      last_name.ilike.%${term}%,
      pin_code.ilike.%${term}%,
      address.ilike.%${term}%,
      email.ilike.%${term}%
    `);
  }

  // Apply pagination
  query = query
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[fetchSearchableClients] Error:', error);
    throw error;
  }

  // Transform data to include computed fields
  const enhancedClients: EnhancedClient[] = (data || []).map(client => ({
    ...client,
    full_name: `${client.first_name} ${client.last_name}`.trim(),
    search_text: `${client.first_name} ${client.last_name} ${client.pin_code || ''} ${client.address || ''} ${client.email || ''}`.toLowerCase()
  }));

  console.log('[fetchSearchableClients] Fetched:', enhancedClients.length, 'clients, total:', count);
  return { clients: enhancedClients, totalCount: count || 0 };
};

export const useSearchableClients = (branchId: string) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientStatus, setClientStatus] = useState<'all' | 'active' | 'former'>('active');
  const [page, setPage] = useState(0);
  const limit = 100;

  const queryParams = useMemo(() => ({
    branchId,
    searchTerm: searchTerm.trim(),
    clientStatus,
    limit,
    offset: page * limit
  }), [branchId, searchTerm, clientStatus, page, limit]);

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['searchable-clients', queryParams],
    queryFn: () => fetchSearchableClients(queryParams),
    enabled: Boolean(branchId),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Client-side filtering for instant response on fast typing
  const filteredClients = useMemo(() => {
    if (!data?.clients) return [];
    
    // Filter from 1 character onwards for better UX
    if (!searchTerm || searchTerm.trim().length === 0) {
      return data.clients;
    }

    const term = searchTerm.toLowerCase().trim();
    return data.clients.filter(client => 
      client.search_text.includes(term)
    );
  }, [data?.clients, searchTerm]);

  const hasNextPage = data ? (page + 1) * limit < data.totalCount : false;
  const hasPreviousPage = page > 0;

  const nextPage = useCallback(() => {
    if (hasNextPage) setPage(prev => prev + 1);
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) setPage(prev => prev - 1);
  }, [hasPreviousPage]);

  const resetPage = useCallback(() => {
    setPage(0);
  }, []);

  return {
    clients: filteredClients,
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    clientStatus,
    setClientStatus,
    page,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    resetPage,
    refetch
  };
};

// Hook for getting recent clients (last selected or recently active)
export const useRecentClients = (branchId: string, limit = 5) => {
  return useQuery({
    queryKey: ['recent-clients', branchId, limit],
    queryFn: async () => {
      if (!branchId) return [];

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, pin_code, status, active_until, created_at')
        .eq('branch_id', branchId)
        .eq('status', 'Active')
        .or(`active_until.is.null,active_until.gte.${today}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(client => ({
        id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        pin_code: client.pin_code,
        status: client.status,
        created_at: client.created_at,
        full_name: `${client.first_name} ${client.last_name}`.trim(),
        search_text: `${client.first_name} ${client.last_name} ${client.pin_code || ''}`.toLowerCase()
      }));
    },
    enabled: Boolean(branchId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};