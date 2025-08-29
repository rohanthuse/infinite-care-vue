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
      // Add timeout to prevent infinite loading
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Admin permissions query timed out')), 5000)
      );

      const queryPromise = async () => {
        if (!user?.id || !branchId) {
          return createDefaultPermissions(); // Return default instead of null
        }

        const { data, error } = await supabase
          .from('admin_permissions')
          .select('*')
          .eq('admin_id', user.id)
          .eq('branch_id', branchId)
          .maybeSingle();

        if (error) {
          console.error('[useAdminPermissions] Error fetching permissions:', error);
          // Return default permissions instead of throwing
          console.warn('[useAdminPermissions] Returning default permissions due to error');
          return createDefaultPermissions();
        }

        // If no permissions found, return default permissions (all true for fallback)
        if (!data) {
          console.warn('[useAdminPermissions] No permissions found, returning default');
          return createDefaultPermissions();
        }

        return data as AdminPermissions;
      };

      try {
        return await Promise.race([queryPromise(), timeout]);
      } catch (error: any) {
        console.error('[useAdminPermissions] Query failed or timed out:', error.message);
        return createDefaultPermissions(); // Return default permissions on timeout
      }
    },
    enabled: !!user?.id && !!branchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

const createDefaultPermissions = (): AdminPermissions => ({
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
  system: true,
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