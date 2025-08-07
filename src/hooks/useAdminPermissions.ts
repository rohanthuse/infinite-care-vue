import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSafe } from "./useAuthSafe";

export interface AdminPermissions {
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

export const useAdminPermissions = (branchId?: string) => {
  const { user } = useAuthSafe();
  
  return useQuery({
    queryKey: ['adminPermissions', user?.id, branchId],
    queryFn: async () => {
      if (!user?.id || !branchId) {
        return null;
      }

      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .eq('admin_id', user.id)
        .eq('branch_id', branchId)
        .maybeSingle();

      if (error) {
        console.error('[useAdminPermissions] Error fetching permissions:', error);
        throw error;
      }

      // If no permissions found, return default permissions (all false)
      if (!data) {
        console.warn('[useAdminPermissions] No permissions found, returning default');
        return createDefaultPermissions();
      }

      return data as AdminPermissions;
    },
    enabled: !!user?.id && !!branchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

const createDefaultPermissions = (): AdminPermissions => ({
  dashboard: false,
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
  notifications: false,
  library: false,
  third_party: false,
  reports: false,
  system: false,
});

// Permission mapping for tabs
export const getTabPermissionKey = (tabValue: string): keyof AdminPermissions | null => {
  const permissionMap: Record<string, keyof AdminPermissions> = {
    'dashboard': 'dashboard',
    'bookings': 'bookings',
    'clients': 'clients',
    'carers': 'carers',
    'reviews': 'reviews',
    'communication': 'communication',
    'medication': 'medication',
    'finance': 'finance',
    'workflow': 'workflow',
    'key-parameters': 'key_parameters',
    'care-plan': 'care_plan',
    'agreements': 'agreements',
    'events-logs': 'events_logs',
    'attendance': 'attendance',
    'form-builder': 'form_builder',
    'documents': 'documents',
    'notifications': 'notifications',
    'library': 'library',
    'third-party': 'third_party',
    'reports': 'reports',
  };
  
  return permissionMap[tabValue] || null;
};

export const hasTabPermission = (permissions: AdminPermissions | null, tabValue: string): boolean => {
  if (!permissions) return false;
  
  const permissionKey = getTabPermissionKey(tabValue);
  if (!permissionKey) return true; // Allow unknown tabs by default
  
  return permissions[permissionKey] === true;
};