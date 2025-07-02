
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Branch } from '@/pages/Branch';

const fetchBranchById = async (id: string): Promise<Branch> => {
    const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        throw new Error(error.message);
    }
    if (!data) {
        throw new Error("Branch not found.");
    }
    return data;
};

export const useBranch = (id: string | undefined) => {
    return useQuery({
        queryKey: ['branch', id],
        queryFn: () => fetchBranchById(id!),
        enabled: !!id,
    });
};
