
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Branch } from '@/pages/Branch';

const fetchBranchById = async (id: string): Promise<Branch> => {
    console.log('fetchBranchById called with id:', id);
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new Error(`Invalid UUID format: ${id}`);
    }

    const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Supabase error in fetchBranchById:', error);
        throw new Error(error.message);
    }
    if (!data) {
        throw new Error("Branch not found.");
    }
    return data;
};

export const useBranch = (id: string | undefined) => {
    console.log('useBranch hook called with id:', id);
    
    return useQuery({
        queryKey: ['branch', id],
        queryFn: () => fetchBranchById(id!),
        enabled: !!id && id !== ':id', // Explicitly check for the placeholder
    });
};
