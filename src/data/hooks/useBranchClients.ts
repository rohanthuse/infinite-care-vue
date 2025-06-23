
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type ClientFromDB = Tables<'clients'>;

interface UseBranchClientsParams {
    branchId: string | undefined;
    searchTerm?: string;
    statusFilter?: string;
    regionFilter?: string;
    page?: number;
    itemsPerPage?: number;
}

interface UseBranchClientsResponse {
    clients: ClientFromDB[];
    count: number;
}

const fetchBranchClients = async ({
    branchId,
    searchTerm,
    statusFilter,
    regionFilter,
    page = 1,
    itemsPerPage = 50,
}: UseBranchClientsParams): Promise<UseBranchClientsResponse> => {
    if (!branchId) {
        return { clients: [], count: 0 };
    }

    let query = supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .eq('branch_id', branchId);

    if (searchTerm) {
        const searchIlke = `%${searchTerm}%`;
        query = query.or(`first_name.ilike.${searchIlke},last_name.ilike.${searchIlke},email.ilike.${searchIlke}`);
    }

    if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
    }

    if (regionFilter && regionFilter !== 'all') {
        query = query.eq('region', regionFilter);
    }

    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching clients:', error);
        throw error;
    }

    return { clients: data as ClientFromDB[], count: count ?? 0 };
};

// Simple version for basic usage
export const useBranchClients = (branchId: string | undefined) => {
    return useQuery({
        queryKey: ['branch-clients', branchId],
        queryFn: () => fetchBranchClients({ branchId }),
        enabled: !!branchId,
    });
};

// Enhanced version for advanced usage
export const useBranchClientsAdvanced = (params: UseBranchClientsParams) => {
    return useQuery({
        queryKey: ['branch-clients-advanced', params],
        queryFn: () => fetchBranchClients(params),
        enabled: !!params.branchId,
    });
};
