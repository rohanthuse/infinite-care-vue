import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export const useTenantSystemAgreements = () => {
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['tenant-system-agreements', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }
      
      const { data, error } = await supabase
        .from('system_tenant_agreements')
        .select(`
          *,
          organizations (
            id,
            name
          ),
          system_tenant_agreement_types (
            id,
            name
          )
        `)
        .eq('tenant_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });
};
