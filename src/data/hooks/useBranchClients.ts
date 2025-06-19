
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type ClientDB = Tables<'clients'>;
export type ClientFromDB = Tables<'clients'>;

interface UseBranchClientsParams {
    branchId: string | undefined;
    searchTerm?: string;
    statusFilter?: string;
    regionFilter?: string;
    page?: number;
    itemsPerPage?: number;
}

const fetchBranchClients = async (branchId: string | undefined) => {
    if (!branchId) {
        return [];
    }

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching clients:', error);
        throw error;
    }

    return data as ClientDB[];
};

// Simple version for compatibility with BranchDashboard
export const useBranchClients = (branchId: string | undefined) => {
    return useQuery({
        queryKey: ['branch-clients', branchId],
        queryFn: () => fetchBranchClients(branchId),
        enabled: !!branchId,
    });
};

// Advanced version with pagination
export const useBranchClientsPaginated = (params: UseBranchClientsParams) => {
    const fetchBranchClientsPaginated = async ({
        branchId,
        searchTerm,
        statusFilter,
        regionFilter,
        page = 1,
        itemsPerPage = 10,
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

    return useQuery({
        queryKey: ['branch-clients-paginated', params],
        queryFn: () => fetchBranchClientsPaginated(params),
        enabled: !!params.branchId,
    });
};

// Delete client mutation
export const useDeleteClient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (clientId: string) => {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', clientId);

            if (error) {
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branch-clients'] });
            queryClient.invalidateQueries({ queryKey: ['branch-clients-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
        },
    });
};
