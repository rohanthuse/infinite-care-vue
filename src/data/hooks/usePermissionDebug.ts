
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PermissionDebugInfo {
  userId: string | null;
  userRoles: string[];
  adminBranches: string[];
  currentBranchAccess: boolean;
}

async function fetchPermissionDebugInfo(branchId?: string): Promise<PermissionDebugInfo> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      userId: null,
      userRoles: [],
      adminBranches: [],
      currentBranchAccess: false
    };
  }

  // Get user roles
  const { data: rolesData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const userRoles = rolesData?.map(r => r.role) || [];

  // Get admin branches
  const { data: branchesData } = await supabase
    .from('admin_branches')
    .select('branch_id')
    .eq('admin_id', user.id);

  const adminBranches = branchesData?.map(b => b.branch_id) || [];

  // Check current branch access
  const currentBranchAccess = 
    userRoles.includes('super_admin') || 
    (branchId && adminBranches.includes(branchId));

  return {
    userId: user.id,
    userRoles,
    adminBranches,
    currentBranchAccess
  };
}

export function usePermissionDebug(branchId?: string) {
  return useQuery({
    queryKey: ["permission-debug", branchId],
    queryFn: () => fetchPermissionDebugInfo(branchId),
    enabled: !!branchId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
