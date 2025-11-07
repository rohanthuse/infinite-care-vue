import { useUserRoleCheck } from './useUserRoleCheck';

/**
 * Hook to check if the current user can submit forms on behalf of staff
 * Admins (super_admin or branch_admin) can submit on behalf of staff in their branches
 */
export const useCanSubmitOnBehalf = (branchId?: string) => {
  const { data: roleInfo, isLoading } = useUserRoleCheck();
  
  if (isLoading || !roleInfo) return { canSubmit: false, isLoading };
  
  // Super admins can submit for any branch
  if (roleInfo.isSuperAdmin) {
    return { canSubmit: true, isLoading: false };
  }
  
  // Branch admins can submit for their branches only
  if (roleInfo.isBranchAdmin && branchId) {
    const canSubmit = roleInfo.associatedBranches.includes(branchId);
    return { canSubmit, isLoading: false };
  }
  
  return { canSubmit: false, isLoading: false };
};
