
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface BranchAdminAccess {
  branchId: string;
  branchName: string;
  branchStatus: string;
  canAccess: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useBranchAdminAccess = (targetBranchId?: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['branch-admin-access', session?.user?.id, targetBranchId],
    queryFn: async (): Promise<BranchAdminAccess> => {
      if (!session?.user?.id) {
        throw new Error('Not authenticated');
      }

      // Get user roles first
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const userRoles = roleData?.map(r => r.role) || [];
      
      // Super admins can access any branch
      if (userRoles.includes('super_admin')) {
        if (targetBranchId) {
          // Get the specific branch details
          const { data: branchData, error } = await supabase
            .from('branches')
            .select('id, name, status')
            .eq('id', targetBranchId)
            .single();

          if (error || !branchData) {
            throw new Error('Branch not found');
          }

          return {
            branchId: branchData.id,
            branchName: branchData.name,
            branchStatus: branchData.status,
            canAccess: true,
            isLoading: false,
            error: null
          };
        } else {
          // No specific branch requested, super admin has general access
          return {
            branchId: '',
            branchName: 'Super Admin',
            branchStatus: 'Active',
            canAccess: true,
            isLoading: false,
            error: null
          };
        }
      }

      // Check if user is a branch admin
      if (!userRoles.includes('branch_admin')) {
        throw new Error('Not a branch admin');
      }

      // Get the admin's branch assignment
      const { data: adminBranchData, error } = await supabase
        .from('admin_branches')
        .select(`
          branch_id,
          branches:branch_id (
            id,
            name,
            status
          )
        `)
        .eq('admin_id', session.user.id)
        .eq('branches.status', 'Active')
        .single();

      if (error) {
        console.error('Error fetching branch access:', error);
        throw new Error('Unable to fetch branch access');
      }

      if (!adminBranchData?.branches) {
        throw new Error('No branch assignment found');
      }

      const branch = adminBranchData.branches;
      const canAccess = !targetBranchId || branch.id === targetBranchId;

      return {
        branchId: branch.id,
        branchName: branch.name,
        branchStatus: branch.status,
        canAccess,
        isLoading: false,
        error: null
      };
    },
    enabled: !!session?.user?.id,
    retry: 1,
  });
};

// Helper hook to check if current user can access a specific branch
export const useCanAccessBranch = (branchId: string) => {
  const { data: branchAccess, isLoading } = useBranchAdminAccess(branchId);
  return {
    canAccess: branchAccess?.canAccess || false,
    isLoading,
    branchName: branchAccess?.branchName
  };
};
