import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StaffGeneralSettings {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  contract_type: string | null;
  salary_frequency: string | null;
  bank_name: string | null;
}

export const useStaffGeneralSettings = (staffId: string) => {
  return useQuery({
    queryKey: ['staff-general-settings', staffId],
    queryFn: async (): Promise<StaffGeneralSettings | null> => {
      if (!staffId) return null;

      const { data, error } = await supabase
        .from('staff')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          status,
          contract_type,
          salary_frequency,
          bank_name
        `)
        .eq('id', staffId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching staff general settings:', error);
        throw error;
      }

      return data;
    },
    enabled: !!staffId,
  });
};

export interface UpdateStaffGeneralSettingsData {
  contract_type?: string | null;
  salary_frequency?: string | null;
  bank_name?: string | null;
}

export const useUpdateStaffGeneralSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, updates }: { staffId: string; updates: UpdateStaffGeneralSettingsData }) => {
      const { data, error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', staffId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff-general-settings', variables.staffId] });
      queryClient.invalidateQueries({ queryKey: ['staffProfile', variables.staffId] });
      toast.success('Staff settings updated successfully');
    },
    onError: (error) => {
      console.error('Error updating staff settings:', error);
      toast.error('Failed to update staff settings');
    },
  });
};
