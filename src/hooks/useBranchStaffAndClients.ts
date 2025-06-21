
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBranchStaffAndClients = (branchId: string) => {
  const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ['branch-staff', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, specialization')
        .eq('branch_id', branchId)
        .eq('status', 'Active');

      if (error) throw error;
      return data || [];
    },
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['branch-clients', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .eq('branch_id', branchId);

      if (error) throw error;
      return data || [];
    },
  });

  return {
    staff,
    clients,
    isLoading: isLoadingStaff || isLoadingClients,
  };
};
