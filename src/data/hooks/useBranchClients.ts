
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type ClientFromDB = Tables<'clients'>;

interface UseBranchClientsParams {
    branchId: string | undefined;
    searchTerm?: string;
    postCodeSearch?: string;
    statusFilter?: string;
    regionFilter?: string;
    sortBy?: 'name' | 'email' | 'pin_code' | 'region' | 'created_at' | 'client_id';
    sortOrder?: 'asc' | 'desc';
    page: number;
    itemsPerPage: number;
}

const fetchBranchClients = async ({
    branchId,
    searchTerm,
    postCodeSearch,
    statusFilter,
    regionFilter,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page,
    itemsPerPage,
}: UseBranchClientsParams) => {
    if (!branchId) {
        return { clients: [], count: 0 };
    }

    let query = supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .eq('branch_id', branchId);

    if (searchTerm) {
        const searchIlke = `%${searchTerm}%`;
        query = query.or(`first_name.ilike.${searchIlke},last_name.ilike.${searchIlke},email.ilike.${searchIlke},client_id.ilike.${searchIlke}`);
    }

    if (postCodeSearch) {
        const postCodeLike = `%${postCodeSearch}%`;
        query = query.ilike('pin_code', postCodeLike);
    }

    if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
    }

    if (regionFilter && regionFilter !== 'all') {
        query = query.eq('region', regionFilter);
    }

    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    // Apply sorting
    let orderColumn: string = sortBy;
    if (sortBy === 'name') {
        orderColumn = 'first_name'; // Sort by first name when 'name' is selected
    }
    
    query = query.range(from, to).order(orderColumn as any, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching clients:', error);
        throw error;
    }

    return { clients: data as ClientFromDB[], count: count ?? 0 };
};

export const useBranchClients = (params: UseBranchClientsParams) => {
    return useQuery({
        queryKey: ['branch-clients', params],
        queryFn: () => fetchBranchClients(params),
        enabled: !!params.branchId,
    });
};
