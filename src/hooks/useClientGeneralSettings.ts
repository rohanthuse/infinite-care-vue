import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientGeneralSettings {
  core_lead_id: string | null;
  agreement_id: string | null;
  expiry_date: string | null;
  join_date: string | null;
  show_in_task_matrix: boolean;
  show_in_form_matrix: boolean;
  enable_geo_fencing: boolean;
}

export const useClientGeneralSettings = (clientId: string) => {
  return useQuery({
    queryKey: ['client-general-settings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('core_lead_id, agreement_id, expiry_date, registered_on, show_in_task_matrix, show_in_form_matrix, enable_geo_fencing')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      
      return {
        core_lead_id: data.core_lead_id || null,
        agreement_id: data.agreement_id || null,
        expiry_date: data.expiry_date || null,
        join_date: data.registered_on || null,
        show_in_task_matrix: data.show_in_task_matrix || false,
        show_in_form_matrix: data.show_in_form_matrix || false,
        enable_geo_fencing: data.enable_geo_fencing || false,
      } as ClientGeneralSettings;
    },
    enabled: !!clientId,
  });
};
