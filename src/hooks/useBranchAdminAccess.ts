
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

      console.log('[useBranchAdminAccess] Checking access for user:', session.user.id, 'target branch:', targetBranchId);

      // Create timeout controller for the entire operation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout

      try {
        // Get user roles with timeout
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .abortSignal(controller.signal);

        if (roleError) {
          console.error('[useBranchAdminAccess] Error fetching user roles:', roleError);
          throw new Error('Unable to fetch user roles');
        }

        const userRoles = roleData?.map(r => r.role) || [];
        console.log('[useBranchAdminAccess] User roles:', userRoles);
        
        // Super admins can access any branch
        if (userRoles.includes('super_admin')) {
          console.log('[useBranchAdminAccess] Super admin detected, granting access');
          
          if (targetBranchId) {
            // Get the specific branch details
            const { data: branchData, error } = await supabase
              .from('branches')
              .select('id, name, status')
              .eq('id', targetBranchId)
              .abortSignal(controller.signal)
              .single();

            if (error || !branchData) {
              console.error('[useBranchAdminAccess] Branch not found:', error);
              throw new Error('Branch not found');
            }

            clearTimeout(timeoutId);
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
            clearTimeout(timeoutId);
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
          console.log('[useBranchAdminAccess] User is not a branch admin');
          throw new Error('Not a branch admin');
        }

        // Get the admin's branch assignments (can be multiple)
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
          .abortSignal(controller.signal);

        if (error) {
          console.error('[useBranchAdminAccess] Error fetching branch access:', error);
          throw new Error('Unable to fetch branch access');
        }

        if (!adminBranchData || adminBranchData.length === 0) {
          console.error('[useBranchAdminAccess] No branch assignments found');
          throw new Error('No branch assignment found for this admin');
        }

        // If a specific branch is requested, check if admin has access to it
        if (targetBranchId) {
          const targetBranch = adminBranchData.find(assignment => 
            assignment.branches?.id === targetBranchId
          );
          
          if (!targetBranch?.branches) {
            console.error('[useBranchAdminAccess] Admin does not have access to target branch:', targetBranchId);
            throw new Error('You do not have access to this branch');
          }

          const branch = targetBranch.branches;
          
          console.log('[useBranchAdminAccess] Branch admin access result:', {
            assignedBranch: branch.id,
            targetBranch: targetBranchId,
            canAccess: true
          });

          clearTimeout(timeoutId);
          return {
            branchId: branch.id,
            branchName: branch.name,
            branchStatus: branch.status,
            canAccess: true,
            isLoading: false,
            error: null
          };
        } else {
          // No specific branch requested, return the first assigned branch
          const firstAssignment = adminBranchData[0];
          if (!firstAssignment?.branches) {
            throw new Error('Invalid branch assignment data');
          }

          const branch = firstAssignment.branches;
          
          console.log('[useBranchAdminAccess] Branch admin access result (first branch):', {
            assignedBranch: branch.id,
            canAccess: true
          });

          clearTimeout(timeoutId);
          return {
            branchId: branch.id,
            branchName: branch.name,
            branchStatus: branch.status,
            canAccess: true,
            isLoading: false,
            error: null
          };
        }
      } catch (accessError) {
        clearTimeout(timeoutId);
        if (accessError.name === 'AbortError') {
          throw new Error('Branch access check timed out - please try again');
        }
        throw accessError;
      }
    },
    enabled: !!session?.user?.id,
    retry: (failureCount, error) => {
      // Don't retry timeout errors, access denied errors, or after first failure
      if (error.message.includes('timed out') || 
          error.message.includes('Access denied') ||
          error.message.includes('Branch access check timed out')) {
        return false;
      }
      return failureCount < 1; // Only retry once to prevent infinite loops
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

// Helper hook to check if current user can access a specific branch
export const useCanAccessBranch = (branchId: string) => {
  const { data: branchAccess, isLoading, error } = useBranchAdminAccess(branchId);
  
  console.log('[useCanAccessBranch] Access check result:', {
    branchId,
    canAccess: branchAccess?.canAccess,
    isLoading,
    error: error?.message
  });
  
  return {
    canAccess: branchAccess?.canAccess || false,
    isLoading,
    branchName: branchAccess?.branchName,
    error: error?.message
  };
};
