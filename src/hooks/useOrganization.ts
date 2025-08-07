import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/hooks/useAuth';

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  permissions: string[];
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useOrganizationMembers = () => {
  const { organization } = useTenant();

  return useQuery({
    queryKey: ['organization-members', organization?.id],
    queryFn: async () => {
      if (!organization) return [];

      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrganizationMember[];
    },
    enabled: !!organization?.id,
  });
};

export const useInviteOrganizationMember = () => {
  const { organization } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!organization || !user) throw new Error('Organization or user not found');

      // Create invitation record
      const { data, error } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organization.id,
          user_id: null, // Will be filled when user accepts invitation
          role,
          status: 'invited',
          invited_by: user.id,
          invited_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Send invitation email
      console.log('Invitation created for:', email);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
    },
  });
};

export const useUpdateOrganizationMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      updates 
    }: { 
      memberId: string; 
      updates: Partial<OrganizationMember> 
    }) => {
      const { data, error } = await supabase
        .from('organization_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
    },
  });
};

export const useRemoveOrganizationMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
    },
  });
};

export const useUpdateOrganization = () => {
  const { organization } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<typeof organization>) => {
      if (!organization) throw new Error('Organization not found');

      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organization.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });
};