import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface ClientMessageRecipient {
  id: string;
  auth_user_id: string;
  name: string;
  avatar: string;
  type: 'branch_admin' | 'super_admin' | 'assigned_carer';
  email?: string;
  canMessage: boolean;
  groupLabel: string;
}

interface AdminUserDetail {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

/**
 * Fetch recipients available for messaging a specific client
 * Returns: Branch Admins, Super Admins, and Assigned Carers ONLY
 * Does NOT return other clients
 */
export const useClientMessageRecipients = (clientId: string) => {
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['client-message-recipients', clientId, organization?.id],
    queryFn: async (): Promise<ClientMessageRecipient[]> => {
      try {
        console.log('[useClientMessageRecipients] Starting fetch for clientId:', clientId);
        
        // First get the client and their branch information
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id, branch_id')
          .eq('id', clientId)
          .single();

        if (clientError) {
          console.error('[useClientMessageRecipients] Error fetching client:', clientError);
          throw clientError;
        }

        if (!client) {
          console.log('[useClientMessageRecipients] Client not found');
          return [];
        }

        console.log('[useClientMessageRecipients] Client branch_id:', client.branch_id);

        // Get the organization_id from the branch
        const { data: branch, error: branchError } = await supabase
          .from('branches')
          .select('organization_id')
          .eq('id', client.branch_id)
          .single();

        if (branchError) {
          console.error('[useClientMessageRecipients] Error fetching branch:', branchError);
          throw branchError;
        }

        if (!branch) {
          console.log('[useClientMessageRecipients] Branch not found');
          return [];
        }

        const organization = branch;
        console.log('[useClientMessageRecipients] Organization:', organization);

        const recipients: ClientMessageRecipient[] = [];
        const addedStaffIds = new Set<string>();

        // 1. Get assigned carers/staff from bookings
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('staff_id')
          .eq('client_id', clientId)
          .not('staff_id', 'is', null);

        if (bookingsError) {
          console.error('[useClientMessageRecipients] Error fetching bookings:', bookingsError);
        } else if (bookings && bookings.length > 0) {
          console.log('[useClientMessageRecipients] Found bookings:', bookings.length);
          
          const staffIdsFromBookings = [...new Set(bookings.map(b => b.staff_id).filter(Boolean))];
          staffIdsFromBookings.forEach(id => addedStaffIds.add(id as string));
        }

        // 2. Get assigned carers/staff from care plans
        const { data: carePlans, error: carePlansError } = await supabase
          .from('client_care_plans')
          .select('staff_id')
          .eq('client_id', clientId)
          .not('staff_id', 'is', null);

        if (carePlansError) {
          console.error('[useClientMessageRecipients] Error fetching care plans:', carePlansError);
        } else if (carePlans && carePlans.length > 0) {
          console.log('[useClientMessageRecipients] Found care plans:', carePlans.length);
          
          const staffIdsFromCarePlans = [...new Set(carePlans.map(cp => cp.staff_id).filter(Boolean))];
          staffIdsFromCarePlans.forEach(id => addedStaffIds.add(id as string));
        }

        // Fetch all unique staff details
        const allStaffIds = Array.from(addedStaffIds);
        console.log('[useClientMessageRecipients] Total unique staff IDs:', allStaffIds.length);
        
        if (allStaffIds.length > 0) {
          const { data: staffMembers, error: staffError } = await supabase
            .from('staff')
            .select('id, auth_user_id, first_name, last_name, email')
            .in('id', allStaffIds);

          if (staffError) {
            console.error('[useClientMessageRecipients] Error fetching staff:', staffError);
          } else if (staffMembers) {
            console.log('[useClientMessageRecipients] Staff members found:', staffMembers.length);
            staffMembers.forEach(staff => {
              if (staff.auth_user_id) {
                recipients.push({
                  id: staff.auth_user_id, // Use auth_user_id as id for consistency
                  auth_user_id: staff.auth_user_id,
                  name: `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Staff Member',
                  avatar: '',
                  type: 'assigned_carer',
                  email: staff.email,
                  canMessage: true,
                  groupLabel: 'Assigned Carers'
                });
              }
            });
          }
        }

        // 3. Get branch admins for this branch
        console.log('[useClientMessageRecipients] Fetching branch admins...');
        try {
          const { data: adminBranches, error: adminBranchesError } = await supabase
            .from('admin_branches')
            .select('admin_id')
            .eq('branch_id', client.branch_id);

          if (adminBranchesError) {
            console.error('[useClientMessageRecipients] Error fetching admin_branches:', adminBranchesError);
          } else if (adminBranches && adminBranches.length > 0) {
            console.log('[useClientMessageRecipients] Found admin_branches:', adminBranches.length);
            
            const adminIds = adminBranches.map((ab: any) => ab.admin_id);
            
            // Try to narrow to branch_admins using user_roles
            const { data: adminUsers, error: adminUsersError } = await supabase
              .from('user_roles')
              .select('user_id')
              .in('user_id', adminIds)
              .eq('role', 'branch_admin');

            const userIds = (adminUsersError || !adminUsers || adminUsers.length === 0) 
              ? adminIds // Fallback to all admin_ids if user_roles query fails
              : adminUsers.map((u: any) => u.user_id);

            console.log('[useClientMessageRecipients] Branch admin user IDs:', userIds.length);
            
            if (userIds.length > 0) {
              // @ts-ignore - RPC function exists but types not yet regenerated
              const { data: adminDetails, error: adminDetailsError } = await supabase
                .rpc('get_admin_user_details', { user_ids: userIds });
              
              if (!adminDetailsError && adminDetails && Array.isArray(adminDetails)) {
                console.log('[useClientMessageRecipients] Branch admin details fetched:', adminDetails.length);
                adminDetails.forEach((admin: any) => {
                  const firstName = admin.first_name || '';
                  const lastName = admin.last_name || '';
                  const displayName = `${firstName} ${lastName}`.trim() || 
                                    admin.email?.split('@')[0] || 
                                    'Branch Admin';
                  
                  recipients.push({
                    id: admin.id, // auth user id
                    auth_user_id: admin.id,
                    name: displayName,
                    avatar: '',
                    type: 'branch_admin',
                    email: admin.email,
                    canMessage: true,
                    groupLabel: 'Branch Admins'
                  });
                });
              } else if (adminDetailsError) {
                console.error('[useClientMessageRecipients] Error fetching admin details:', adminDetailsError);
              }
            }
          } else {
            console.log('[useClientMessageRecipients] No admin_branches found for this branch');
          }
        } catch (error) {
          console.error('[useClientMessageRecipients] Error in branch admin fetch:', error);
        }

        // 4. Get super admins in the same organization
        console.log('[useClientMessageRecipients] Fetching super admins...');
        try {
          // Get all branches in the organization
          const { data: orgBranches, error: orgBranchesError } = await supabase
            .from('branches')
            .select('id')
            .eq('organization_id', organization.organization_id);

          if (orgBranchesError) {
            console.error('[useClientMessageRecipients] Error fetching org branches:', orgBranchesError);
          } else if (orgBranches && orgBranches.length > 0) {
            console.log('[useClientMessageRecipients] Found org branches:', orgBranches.length);
            
            const branchIds = orgBranches.map(b => b.id);
            
            // Get admin_ids for all branches in the org
            const { data: orgAdminBranches, error: orgAdminBranchesError } = await supabase
              .from('admin_branches')
              .select('admin_id')
              .in('branch_id', branchIds);

            if (orgAdminBranchesError) {
              console.error('[useClientMessageRecipients] Error fetching org admin_branches:', orgAdminBranchesError);
            } else if (orgAdminBranches && orgAdminBranches.length > 0) {
              console.log('[useClientMessageRecipients] Found org admin_branches:', orgAdminBranches.length);
              
              const orgAdminIds = [...new Set(orgAdminBranches.map((ab: any) => ab.admin_id))];
              
              // Filter to super_admins only
              const { data: superAdminRoles, error: superAdminRolesError } = await supabase
                .from('user_roles')
                .select('user_id')
                .in('user_id', orgAdminIds)
                .eq('role', 'super_admin');

              if (superAdminRolesError) {
                console.error('[useClientMessageRecipients] Error fetching super admin user_roles:', superAdminRolesError);
              } else if (superAdminRoles && superAdminRoles.length > 0) {
                console.log('[useClientMessageRecipients] Found super admins in user_roles:', superAdminRoles.length);
                
                const superAdminIds = superAdminRoles.map((r: any) => r.user_id);
                
                if (superAdminIds.length > 0) {
                  // @ts-ignore - RPC function exists but types not yet regenerated
                  const { data: adminDetails, error: adminDetailsError } = await supabase
                    .rpc('get_admin_user_details', { user_ids: superAdminIds });
                  
                  if (!adminDetailsError && adminDetails && Array.isArray(adminDetails)) {
                    console.log('[useClientMessageRecipients] Super admin details fetched:', adminDetails.length);
                    adminDetails.forEach((admin: any) => {
                      const firstName = admin.first_name || '';
                      const lastName = admin.last_name || '';
                      const displayName = `${firstName} ${lastName}`.trim() || 
                                        admin.email?.split('@')[0] || 
                                        'Super Admin';
                      
                      recipients.push({
                        id: admin.id, // auth user id
                        auth_user_id: admin.id,
                        name: displayName,
                        avatar: '',
                        type: 'super_admin',
                        email: admin.email,
                        canMessage: true,
                        groupLabel: 'Super Admins'
                      });
                    });
                  } else if (adminDetailsError) {
                    console.error('[useClientMessageRecipients] Error fetching super admin details:', adminDetailsError);
                  }
                }
              } else {
                console.log('[useClientMessageRecipients] No super admins found in user_roles');
              }
            } else {
              console.log('[useClientMessageRecipients] No org admin_branches found');
            }
          } else {
            console.log('[useClientMessageRecipients] No org branches found');
          }
        } catch (error) {
          console.error('[useClientMessageRecipients] Error in super admin fetch:', error);
        }

        console.log('[useClientMessageRecipients] Found recipients:', recipients.length);
        return recipients.sort((a, b) => {
          const groupOrder = { 'Assigned Carers': 1, 'Branch Admins': 2, 'Super Admins': 3 };
          const groupCompare = groupOrder[a.groupLabel] - groupOrder[b.groupLabel];
          if (groupCompare !== 0) return groupCompare;
          return a.name.localeCompare(b.name);
        });

      } catch (error) {
        console.error('[useClientMessageRecipients] Error:', error);
        throw error;
      }
    },
    enabled: !!clientId && !!organization,
    staleTime: 300000,
  });
};
