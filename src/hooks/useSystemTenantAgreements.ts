import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  SystemTenantAgreement,
  SystemTenantAgreementType,
  SystemTenantAgreementTemplate,
  CreateSystemTenantAgreementData,
  UpdateSystemTenantAgreementData,
} from '@/types/systemTenantAgreements';

// Fetch all tenant agreements
export const useSystemTenantAgreements = () => {
  return useQuery<SystemTenantAgreement[], Error>({
    queryKey: ['system-tenant-agreements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_tenant_agreements')
        .select(`
          *,
          organizations:tenant_id (id, name),
          system_tenant_agreement_types:type_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SystemTenantAgreement[];
    },
  });
};

// Fetch agreement types
export const useSystemTenantAgreementTypes = () => {
  return useQuery<SystemTenantAgreementType[], Error>({
    queryKey: ['system-tenant-agreement-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_tenant_agreement_types')
        .select('*')
        .eq('status', 'Active')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as SystemTenantAgreementType[];
    },
  });
};

// Fetch agreement templates
export const useSystemTenantAgreementTemplates = () => {
  return useQuery<SystemTenantAgreementTemplate[], Error>({
    queryKey: ['system-tenant-agreement-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_tenant_agreement_templates')
        .select(`
          *,
          system_tenant_agreement_types:type_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SystemTenantAgreementTemplate[];
    },
  });
};

// Create new agreement
export const useCreateSystemTenantAgreement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSystemTenantAgreementData) => {
      const { data: result, error } = await supabase
        .from('system_tenant_agreements')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['system-tenant-agreements'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-system-agreements'] });
      queryClient.invalidateQueries({ queryKey: ['system-tenants'] });
      
      // Send notification to organization
      if (result.tenant_id) {
        try {
          await supabase.functions.invoke('create-tenant-agreement-notifications', {
            body: {
              agreement_id: result.id,
              agreement_title: result.title || 'Tenant Agreement',
              organization_id: result.tenant_id,
              action_type: 'new'
            }
          });
          console.log('[useCreateSystemTenantAgreement] Notification sent successfully');
        } catch (notifError) {
          console.error('[useCreateSystemTenantAgreement] Failed to send notification:', notifError);
        }
      }
      
      toast.success('Agreement created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating agreement:', error);
      toast.error(`Failed to create agreement: ${error.message}`);
    },
  });
};

// Update agreement
export const useUpdateSystemTenantAgreement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSystemTenantAgreementData }) => {
      const { data: result, error } = await supabase
        .from('system_tenant_agreements')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['system-tenant-agreements'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-system-agreements'] });
      
      // Send notification to organization
      if (result.tenant_id) {
        try {
          await supabase.functions.invoke('create-tenant-agreement-notifications', {
            body: {
              agreement_id: result.id,
              agreement_title: result.title || 'Tenant Agreement',
              organization_id: result.tenant_id,
              action_type: 'updated'
            }
          });
          console.log('[useUpdateSystemTenantAgreement] Notification sent successfully');
        } catch (notifError) {
          console.error('[useUpdateSystemTenantAgreement] Failed to send notification:', notifError);
        }
      }
      
      toast.success('Agreement updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating agreement:', error);
      toast.error(`Failed to update agreement: ${error.message}`);
    },
  });
};

// Delete agreement
export const useDeleteSystemTenantAgreement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('system_tenant_agreements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-tenant-agreements'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-system-agreements'] });
      toast.success('Agreement deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting agreement:', error);
      toast.error(`Failed to delete agreement: ${error.message}`);
    },
  });
};

// Create template
export const useCreateSystemTenantAgreementTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<SystemTenantAgreementTemplate, 'id' | 'usage_count' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('system_tenant_agreement_templates')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-tenant-agreement-templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating template:', error);
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
};

// Delete template
export const useDeleteSystemTenantAgreementTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('system_tenant_agreement_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-tenant-agreement-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting template:', error);
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
};
