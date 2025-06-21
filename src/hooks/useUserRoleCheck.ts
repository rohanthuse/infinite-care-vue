
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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        console.log('Checking roles for user:', user.id);

        // Get user roles with error handling
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) {
          console.warn('Error fetching user roles:', rolesError);
          // Continue with empty roles instead of failing
        }

        const roles = userRoles?.map(ur => ur.role) || [];
        console.log('User roles:', roles);
        
        // Check if user is super admin
        const isSuperAdmin = roles.includes('super_admin');
        
        // Check if user is branch admin and get associated branches
        const isBranchAdmin = roles.includes('branch_admin');
        let associatedBranches: string[] = [];
        
        if (isBranchAdmin) {
          try {
            const { data: adminBranches, error: branchError } = await supabase
              .from('admin_branches')
              .select('branch_id')
              .eq('admin_id', user.id);
            
            if (branchError) {
              console.warn('Error fetching admin branches:', branchError);
            } else {
              associatedBranches = adminBranches?.map(ab => ab.branch_id) || [];
            }
          } catch (error) {
            console.warn('Error in admin branches query:', error);
          }
        }
        
        // Check if user is staff and get assigned branch
        const isStaff = roles.includes('carer');
        let assignedBranchId: string | undefined;
        
        if (isStaff) {
          try {
            const { data: staffInfo, error: staffError } = await supabase
              .from('staff')
              .select('branch_id')
              .eq('id', user.id)
              .single();
            
            if (staffError) {
              console.warn('Error fetching staff info:', staffError);
            } else {
              assignedBranchId = staffInfo?.branch_id;
              
              // If staff has an assigned branch, add it to associated branches for document access
              if (assignedBranchId && !associatedBranches.includes(assignedBranchId)) {
                associatedBranches.push(assignedBranchId);
              }
            }
          } catch (error) {
            console.warn('Error in staff query:', error);
          }
        }

        const result = {
          userId: user.id,
          roles,
          isSuperAdmin,
          isBranchAdmin,
          isStaff,
          associatedBranches,
          assignedBranchId,
        };

        console.log('User role check result:', result);
        return result;
      } catch (error) {
        console.error('Error in useUserRoleCheck:', error);
        // Return a safe default instead of throwing
        return {
          userId: '',
          roles: [],
          isSuperAdmin: false,
          isBranchAdmin: false,
          isStaff: false,
          associatedBranches: [],
          assignedBranchId: undefined,
        };
      }
    },
    enabled: true,
    retry: 2,
    retryDelay: 1000,
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
