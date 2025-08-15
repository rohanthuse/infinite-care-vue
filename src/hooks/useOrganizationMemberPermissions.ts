import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrganizationMemberPermissions {
  // Core permissions
  dashboard?: boolean;
  bookings?: boolean;
  clients?: boolean;
  carers?: boolean;
  reviews?: boolean;
  communication?: boolean;
  medication?: boolean;
  finance?: boolean;
  
  // Workflow permissions
  workflow?: boolean;
  key_parameters?: boolean;
  
  // Care plan permissions
  care_plan?: boolean;
  under_review_care_plan?: boolean;
  
  // Administration permissions
  agreements?: boolean;
  events_logs?: boolean;
  attendance?: boolean;
  
  // Resource permissions
  form_builder?: boolean;
  documents?: boolean;
  notifications?: boolean;
  library?: boolean;
  third_party?: boolean;
  
  // Reports permissions
  reports?: boolean;
  
  // System permissions
  system?: boolean;
}

export const defaultOrganizationMemberPermissions: OrganizationMemberPermissions = {
  dashboard: true,
  bookings: false,
  clients: false,
  carers: false,
  reviews: false,
  communication: false,
  medication: false,
  finance: false,
  workflow: false,
  key_parameters: false,
  care_plan: false,
  under_review_care_plan: false,
  agreements: false,
  events_logs: false,
  attendance: false,
  form_builder: false,
  documents: false,
  notifications: true,
  library: false,
  third_party: false,
  reports: false,
  system: false,
};

export const adminOrganizationMemberPermissions: OrganizationMemberPermissions = {
  dashboard: true,
  bookings: true,
  clients: true,
  carers: true,
  reviews: true,
  communication: true,
  medication: true,
  finance: true,
  workflow: true,
  key_parameters: true,
  care_plan: true,
  under_review_care_plan: true,
  agreements: true,
  events_logs: true,
  attendance: true,
  form_builder: true,
  documents: true,
  notifications: true,
  library: true,
  third_party: true,
  reports: true,
  system: false,
};

export const managerOrganizationMemberPermissions: OrganizationMemberPermissions = {
  dashboard: true,
  bookings: true,
  clients: true,
  carers: true,
  reviews: true,
  communication: true,
  medication: false,
  finance: false,
  workflow: true,
  key_parameters: false,
  care_plan: true,
  under_review_care_plan: true,
  agreements: false,
  events_logs: true,
  attendance: true,
  form_builder: false,
  documents: true,
  notifications: true,
  library: true,
  third_party: false,
  reports: true,
  system: false,
};

export const getPermissionTemplateByRole = (role: string): OrganizationMemberPermissions => {
  switch (role) {
    case 'admin':
      return adminOrganizationMemberPermissions;
    case 'manager':
      return managerOrganizationMemberPermissions;
    case 'member':
    default:
      return defaultOrganizationMemberPermissions;
  }
};

export const useOrganizationMemberPermissions = (memberId?: string) => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['organization-member-permissions', memberId],
    queryFn: async () => {
      if (!memberId) return null;

      const { data, error } = await supabase
        .from('organization_members')
        .select('permissions')
        .eq('id', memberId)
        .single();

      if (error) {
        console.error('[useOrganizationMemberPermissions] Error fetching permissions:', error);
        throw error;
      }

      // Parse the permissions JSON or return default permissions
      const permissions = data?.permissions as OrganizationMemberPermissions || defaultOrganizationMemberPermissions;
      return permissions;
    },
    enabled: !!memberId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateOrganizationMemberPermissions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      permissions 
    }: { 
      memberId: string; 
      permissions: OrganizationMemberPermissions 
    }) => {
      const { data, error } = await supabase
        .from('organization_members')
        .update({ 
          permissions: permissions as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Permissions Updated",
        description: "Member permissions have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['organization-member-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });
};

// Permission checking utilities
export const hasOrganizationPermission = (
  permissions: OrganizationMemberPermissions | null | undefined, 
  permission: keyof OrganizationMemberPermissions
): boolean => {
  if (!permissions) return false;
  return permissions[permission] === true;
};

export const getPermissionsSummary = (permissions: OrganizationMemberPermissions): string => {
  const enabledPermissions = Object.entries(permissions)
    .filter(([_, value]) => value === true)
    .map(([key, _]) => key.replace('_', ' '));
  
  const count = enabledPermissions.length;
  
  if (count === 0) return "No permissions";
  if (count <= 3) return enabledPermissions.join(', ');
  return `${count} permissions enabled`;
};