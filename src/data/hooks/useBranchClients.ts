
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

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
        .select(`
            *,
            client_addresses (
                address_line_1,
                address_line_2,
                city,
                state_county,
                postcode,
                country,
                is_default
            )
        `, { count: 'exact' })
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

// Delete single client
export async function deleteClient(clientId: string) {
    console.log('[deleteClient] Deleting client:', clientId);
    
    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

    if (error) {
        console.error('[deleteClient] Error:', error);
        throw error;
    }
    
    console.log('[deleteClient] Deleted client successfully');
}

// Hook for deleting single client
export function useDeleteClient() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: deleteClient,
        onSuccess: async () => {
            // Force immediate refetch instead of just invalidating
            await queryClient.refetchQueries({ 
                queryKey: ['branch-clients'],
                type: 'active'
            });
            queryClient.invalidateQueries({ queryKey: ['branch-dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['branch-statistics'] });
            toast({
                title: "Success",
                description: "Client deleted successfully",
            });
        },
        onError: (error: any) => {
            console.error('[useDeleteClient] Error:', error);
            let errorMessage = "Failed to delete client";
            if (error.message?.includes('permission') || error.message?.includes('access')) {
                errorMessage = "Access denied: You do not have permission to delete this client";
            }
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        }
    });
}

// Delete multiple clients
export async function deleteMultipleClients(clientIds: string[]) {
    console.log('[deleteMultipleClients] Deleting clients:', clientIds);
    
    const { error } = await supabase
        .from('clients')
        .delete()
        .in('id', clientIds);

    if (error) {
        console.error('[deleteMultipleClients] Error:', error);
        throw error;
    }
    
    console.log('[deleteMultipleClients] Deleted clients successfully');
}

// Hook for deleting multiple clients
export function useDeleteMultipleClients() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: deleteMultipleClients,
        onSuccess: async (_, clientIds) => {
            // Force immediate refetch instead of just invalidating
            await queryClient.refetchQueries({ 
                queryKey: ['branch-clients'],
                type: 'active'
            });
            queryClient.invalidateQueries({ queryKey: ['branch-dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['branch-statistics'] });
            toast({
                title: "Success",
                description: `${clientIds.length} client${clientIds.length > 1 ? 's' : ''} deleted successfully`,
            });
        },
        onError: (error: any) => {
            console.error('[useDeleteMultipleClients] Error:', error);
            toast({
                title: "Error",
                description: "Failed to delete clients",
                variant: "destructive",
            });
        }
    });
}
