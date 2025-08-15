
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCarerAuth } from "./useCarerAuth";

export const useCarerBranch = () => {
  const { user } = useCarerAuth();

  return useQuery({
    queryKey: ['carer-branch', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      console.log('[useCarerBranch] Fetching branch for carer:', user.id);
      
      const { data: staffRecord, error } = await supabase
        .from('staff')
        .select(`
          id,
          branch_id,
          first_name,
          last_name,
          branches:branch_id (
            id,
            name,
            address
          )
        `)
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useCarerBranch] Error fetching staff record:', error);
        throw error;
      }

      console.log('[useCarerBranch] Staff record found:', staffRecord);
      return staffRecord;
    },
    enabled: !!user?.id,
  });
};
