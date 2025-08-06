import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BranchAdmin {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  branch_id: string;
}

const fetchBranchAdmins = async (branchId: string): Promise<BranchAdmin[]> => {
  // First get admin IDs from admin_branches table
  const { data: adminBranchData, error: adminBranchError } = await supabase
    .from('admin_branches')
    .select('admin_id')
    .eq('branch_id', branchId);

  if (adminBranchError) {
    console.error('Error fetching admin branches:', adminBranchError);
    throw adminBranchError;
  }

  if (!adminBranchData || adminBranchData.length === 0) {
    return [];
  }

  // Get admin user details from auth.users via RPC or direct query
  // Since we can't directly query auth.users, we'll need to use user_roles and try to get names
  const adminIds = adminBranchData.map(item => item.admin_id);
  
  const { data: userRoles, error: userRolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('user_id', adminIds)
    .eq('role', 'branch_admin');

  if (userRolesError) {
    console.error('Error fetching user roles:', userRolesError);
    // Continue with what we have
  }

  // For now, return admin IDs with default names since we can't access auth.users directly
  return adminBranchData.map(item => ({
    id: item.admin_id,
    first_name: 'Branch',
    last_name: 'Admin',
    email: '',
    branch_id: branchId
  }));
};

export const useBranchAdmins = (branchId: string) => {
  return useQuery({
    queryKey: ['branch-admins', branchId],
    queryFn: () => fetchBranchAdmins(branchId),
    enabled: Boolean(branchId),
  });
};