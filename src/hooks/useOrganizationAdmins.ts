import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminWithProfile {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'super_admin' | 'branch_admin';
}

/**
 * Fetches super admins for an organization
 */
const fetchOrganizationSuperAdmins = async (organizationId: string): Promise<AdminWithProfile[]> => {
  if (!organizationId) return [];

  // Get all branches for this organization
  const { data: branches, error: branchError } = await supabase
    .from('branches')
    .select('id')
    .eq('organization_id', organizationId);

  if (branchError || !branches?.length) {
    console.error('Error fetching branches:', branchError);
    return [];
  }

  const branchIds = branches.map(b => b.id);

  // Get admin IDs from admin_branches for these branches
  const { data: adminBranches, error: abError } = await supabase
    .from('admin_branches')
    .select('admin_id')
    .in('branch_id', branchIds);

  if (abError || !adminBranches?.length) {
    return [];
  }

  const adminIds = [...new Set(adminBranches.map(ab => ab.admin_id))];

  // Filter to super_admins only
  const { data: superAdminRoles, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('user_id', adminIds)
    .eq('role', 'super_admin');

  if (roleError || !superAdminRoles?.length) {
    return [];
  }

  const superAdminIds = superAdminRoles.map(r => r.user_id);

  // Get profiles for these super admins
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('id', superAdminIds);

  if (profileError || !profiles?.length) {
    return [];
  }

  // Deduplicate profiles by id to prevent selection bugs
  const uniqueProfiles = [...new Map(profiles.map(p => [p.id, p])).values()];

  return uniqueProfiles.map(profile => ({
    id: profile.id,
    auth_user_id: profile.id,
    first_name: profile.first_name || 'Super',
    last_name: profile.last_name || 'Admin',
    email: profile.email || '',
    role: 'super_admin' as const,
  }));
};

/**
 * Fetches branch admins for a specific branch with profile data
 */
const fetchBranchAdminsWithProfiles = async (branchId: string): Promise<AdminWithProfile[]> => {
  if (!branchId) return [];

  // Get admin IDs from admin_branches
  const { data: adminBranches, error: abError } = await supabase
    .from('admin_branches')
    .select('admin_id')
    .eq('branch_id', branchId);

  if (abError || !adminBranches?.length) {
    return [];
  }

  const adminIds = adminBranches.map(ab => ab.admin_id);

  // Filter to branch_admins only
  const { data: branchAdminRoles, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('user_id', adminIds)
    .eq('role', 'branch_admin');

  if (roleError || !branchAdminRoles?.length) {
    return [];
  }

  const branchAdminIds = branchAdminRoles.map(r => r.user_id);

  // Get profiles for these branch admins
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('id', branchAdminIds);

  if (profileError || !profiles?.length) {
    return [];
  }

  // Deduplicate profiles by id to prevent selection bugs
  const uniqueProfiles = [...new Map(profiles.map(p => [p.id, p])).values()];

  return uniqueProfiles.map(profile => ({
    id: profile.id,
    auth_user_id: profile.id,
    first_name: profile.first_name || 'Branch',
    last_name: profile.last_name || 'Admin',
    email: profile.email || '',
    role: 'branch_admin' as const,
  }));
};

export const useOrganizationSuperAdmins = (organizationId: string) => {
  return useQuery({
    queryKey: ['organization-super-admins', organizationId],
    queryFn: () => fetchOrganizationSuperAdmins(organizationId),
    enabled: Boolean(organizationId),
  });
};

export const useBranchAdminsWithProfiles = (branchId: string) => {
  return useQuery({
    queryKey: ['branch-admins-with-profiles', branchId],
    queryFn: () => fetchBranchAdminsWithProfiles(branchId),
    enabled: Boolean(branchId),
  });
};
