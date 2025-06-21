
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserRoleInfo {
  userId: string;
  roles: string[];
  isSuperAdmin: boolean;
  isBranchAdmin: boolean;
  isStaff: boolean;
  associatedBranches: string[];
  assignedBranchId?: string;
}

export const useUserRoleCheck = () => {
  return useQuery({
    queryKey: ['user-role-check'],
    queryFn: async (): Promise<UserRoleInfo> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const roles = userRoles?.map(ur => ur.role) || [];
      
      // Check if user is super admin
      const isSuperAdmin = roles.includes('super_admin');
      
      // Check if user is branch admin and get associated branches
      const isBranchAdmin = roles.includes('branch_admin');
      let associatedBranches: string[] = [];
      
      if (isBranchAdmin) {
        const { data: adminBranches } = await supabase
          .from('admin_branches')
          .select('branch_id')
          .eq('admin_id', user.id);
        
        associatedBranches = adminBranches?.map(ab => ab.branch_id) || [];
      }
      
      // Check if user is staff and get assigned branch
      const isStaff = roles.includes('carer');
      let assignedBranchId: string | undefined;
      
      if (isStaff) {
        const { data: staffInfo } = await supabase
          .from('staff')
          .select('branch_id')
          .eq('id', user.id)
          .single();
        
        assignedBranchId = staffInfo?.branch_id;
        
        // If staff has an assigned branch, add it to associated branches for document access
        if (assignedBranchId && !associatedBranches.includes(assignedBranchId)) {
          associatedBranches.push(assignedBranchId);
        }
      }

      return {
        userId: user.id,
        roles,
        isSuperAdmin,
        isBranchAdmin,
        isStaff,
        associatedBranches,
        assignedBranchId,
      };
    },
    enabled: true,
    retry: 1,
  });
};

export const useCanAccessBranch = (branchId: string) => {
  const { data: roleInfo } = useUserRoleCheck();
  
  if (!roleInfo) return false;
  
  // Super admins can access all branches
  if (roleInfo.isSuperAdmin) return true;
  
  // Branch admins can access their associated branches
  if (roleInfo.isBranchAdmin && roleInfo.associatedBranches.includes(branchId)) {
    return true;
  }
  
  // Staff can access their assigned branch
  if (roleInfo.isStaff && roleInfo.assignedBranchId === branchId) {
    return true;
  }
  
  return false;
};
