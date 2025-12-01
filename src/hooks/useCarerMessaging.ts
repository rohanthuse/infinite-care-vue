import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCarerContext } from "@/hooks/useCarerContext";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";

export interface MessageContact {
  id: string;
  name: string;
  auth_user_id: string;
  branch_id: string;
  organization_id: string;
}

export interface AdminContact {
  id: string;
  name: string;
  auth_user_id: string;
  email?: string;
  type: 'branch_admin' | 'super_admin';
  groupLabel: string;
}

export const useCarerAdminContacts = () => {
  const { data: carerContext } = useCarerContext();
  
  return useQuery({
    queryKey: ['carer-admin-contacts', carerContext?.staffId, carerContext?.branchInfo?.id],
    queryFn: async (): Promise<AdminContact[]> => {
      if (!carerContext?.staffId || !carerContext?.branchInfo?.id) {
        throw new Error('No carer context available');
      }

      console.log('[useCarerAdminContacts] Starting with carer:', {
        staffId: carerContext.staffId,
        branchId: carerContext.branchInfo.id
      });

      try {
        const recipients: AdminContact[] = [];

        // 1. Get branch admins for this branch
        console.log('[useCarerAdminContacts] Fetching branch admins...');
        const { data: adminBranches, error: adminBranchesError } = await (supabase as any)
          .from('admin_branches')
          .select('admin_id')
          .eq('branch_id', carerContext.branchInfo.id);

        if (adminBranchesError) {
          console.error('[useCarerAdminContacts] Error fetching admin_branches:', adminBranchesError);
        } else if (adminBranches && adminBranches.length > 0) {
          console.log('[useCarerAdminContacts] Found admin_branches:', adminBranches.length);
          
          const adminIds = adminBranches.map((ab: any) => ab.admin_id);
          
          // Filter to branch_admins using user_roles
          const { data: adminUsers, error: adminUsersError } = await (supabase as any)
            .from('user_roles')
            .select('user_id')
            .in('user_id', adminIds)
            .eq('role', 'branch_admin');

          const userIds = (adminUsersError || !adminUsers || adminUsers.length === 0) 
            ? adminIds // Fallback to all admin_ids if user_roles query fails
            : adminUsers.map((u: any) => u.user_id);

          console.log('[useCarerAdminContacts] Branch admin user IDs:', userIds.length);
          
          if (userIds.length > 0) {
            const { data: adminDetails, error: adminDetailsError } = await (supabase as any)
              .rpc('get_admin_user_details', { user_ids: userIds });
            
            if (adminDetailsError) {
              console.error('[useCarerAdminContacts] RPC error for branch admins, using fallback:', adminDetailsError);
              // Fallback: Create basic entries with admin IDs
              userIds.forEach((userId: string) => {
                recipients.push({
                  id: userId,
                  auth_user_id: userId,
                  name: 'Branch Admin',
                  email: '',
                  type: 'branch_admin',
                  groupLabel: 'Branch Admins'
                });
              });
            } else if (!adminDetails || !Array.isArray(adminDetails) || adminDetails.length === 0) {
              console.log('[useCarerAdminContacts] RPC returned empty for branch admins, using fallback');
              // RPC returned empty but we have valid IDs - use fallback
              userIds.forEach((userId: string) => {
                recipients.push({
                  id: userId,
                  auth_user_id: userId,
                  name: 'Branch Admin',
                  email: '',
                  type: 'branch_admin',
                  groupLabel: 'Branch Admins'
                });
              });
            } else {
              console.log('[useCarerAdminContacts] Branch admin details fetched:', adminDetails.length);
              adminDetails.forEach((admin: any) => {
                const firstName = admin.first_name || '';
                const lastName = admin.last_name || '';
                const displayName = `${firstName} ${lastName}`.trim() || 
                                  admin.email?.split('@')[0] || 
                                  'Branch Admin';
                
                recipients.push({
                  id: admin.id,
                  auth_user_id: admin.id,
                  name: displayName,
                  email: admin.email,
                  type: 'branch_admin',
                  groupLabel: 'Branch Admins'
                });
              });
            }
          }
        }

        // 2. Get super admins in the same organization
        console.log('[useCarerAdminContacts] Fetching super admins...');
        
        // Get the organization_id from the carer's branch
        const { data: branch, error: branchError } = await (supabase as any)
          .from('branches')
          .select('organization_id')
          .eq('id', carerContext.branchInfo.id)
          .single();

        if (branchError) {
          console.error('[useCarerAdminContacts] Error fetching branch:', branchError);
        } else if (branch) {
          // Get all branches in the organization
          const { data: orgBranches, error: orgBranchesError } = await (supabase as any)
            .from('branches')
            .select('id')
            .eq('organization_id', branch.organization_id);

          if (orgBranchesError) {
            console.error('[useCarerAdminContacts] Error fetching org branches:', orgBranchesError);
          } else if (orgBranches && orgBranches.length > 0) {
            console.log('[useCarerAdminContacts] Found org branches:', orgBranches.length);
            
            const branchIds = orgBranches.map((b: any) => b.id);
            
            // Get admin_ids for all branches in the org
            const { data: orgAdminBranches, error: orgAdminBranchesError } = await (supabase as any)
              .from('admin_branches')
              .select('admin_id')
              .in('branch_id', branchIds);

            if (orgAdminBranchesError) {
              console.error('[useCarerAdminContacts] Error fetching org admin_branches:', orgAdminBranchesError);
            } else if (orgAdminBranches && orgAdminBranches.length > 0) {
              console.log('[useCarerAdminContacts] Found org admin_branches:', orgAdminBranches.length);
              
              const orgAdminIds = [...new Set(orgAdminBranches.map((ab: any) => ab.admin_id))];
              
              // Filter to super_admins only
              const { data: superAdminRoles, error: superAdminRolesError } = await (supabase as any)
                .from('user_roles')
                .select('user_id')
                .in('user_id', orgAdminIds)
                .eq('role', 'super_admin');

              if (superAdminRolesError) {
                console.error('[useCarerAdminContacts] Error fetching super admin user_roles:', superAdminRolesError);
              } else if (superAdminRoles && superAdminRoles.length > 0) {
                console.log('[useCarerAdminContacts] Found super admins in user_roles:', superAdminRoles.length);
                
                const superAdminIds = superAdminRoles.map((r: any) => r.user_id);
                
                if (superAdminIds.length > 0) {
                  const { data: adminDetails, error: adminDetailsError } = await (supabase as any)
                    .rpc('get_admin_user_details', { user_ids: superAdminIds });
                  
                  if (adminDetailsError) {
                    console.error('[useCarerAdminContacts] RPC error for super admins, using fallback:', adminDetailsError);
                    // Fallback: Create basic entries with admin IDs
                    superAdminIds.forEach((userId: string) => {
                      recipients.push({
                        id: userId,
                        auth_user_id: userId,
                        name: 'Super Admin',
                        email: '',
                        type: 'super_admin',
                        groupLabel: 'Super Admins'
                      });
                    });
                  } else if (!adminDetails || !Array.isArray(adminDetails) || adminDetails.length === 0) {
                    console.log('[useCarerAdminContacts] RPC returned empty for super admins, using fallback');
                    // RPC returned empty but we have valid IDs - use fallback
                    superAdminIds.forEach((userId: string) => {
                      recipients.push({
                        id: userId,
                        auth_user_id: userId,
                        name: 'Super Admin',
                        email: '',
                        type: 'super_admin',
                        groupLabel: 'Super Admins'
                      });
                    });
                  } else {
                    console.log('[useCarerAdminContacts] Super admin details fetched:', adminDetails.length);
                    adminDetails.forEach((admin: any) => {
                      const firstName = admin.first_name || '';
                      const lastName = admin.last_name || '';
                      const displayName = `${firstName} ${lastName}`.trim() || 
                                        admin.email?.split('@')[0] || 
                                        'Super Admin';
                      
                      recipients.push({
                        id: admin.id,
                        auth_user_id: admin.id,
                        name: displayName,
                        email: admin.email,
                        type: 'super_admin',
                        groupLabel: 'Super Admins'
                      });
                    });
                  }
                }
              }
            }
          }
        }

        console.log('[useCarerAdminContacts] Found recipients:', recipients.length);
        
        // Sort by type (Branch Admin first, then Super Admin) and then by name
        return recipients.sort((a, b) => {
          const typeOrder = { 'branch_admin': 1, 'super_admin': 2 };
          const typeCompare = typeOrder[a.type] - typeOrder[b.type];
          if (typeCompare !== 0) return typeCompare;
          return a.name.localeCompare(b.name);
        });
      } catch (error) {
        console.error('Error in useCarerAdminContacts:', error);
        throw error;
      }
    },
    enabled: !!carerContext?.staffId && !!carerContext?.branchInfo?.id,
  });
};

export interface InternalContact {
  id: string;
  name: string;
  auth_user_id: string;
  email?: string;
  type: 'carer' | 'staff' | 'admin' | 'branch_admin' | 'super_admin';
  groupLabel: string;
}

export const useCarerInternalContacts = () => {
  const { data: carerContext } = useCarerContext();
  
  return useQuery({
    queryKey: ['carer-internal-contacts', carerContext?.staffId, carerContext?.branchInfo?.organization_id],
    queryFn: async (): Promise<InternalContact[]> => {
      if (!carerContext?.staffId || !carerContext?.branchInfo?.organization_id) {
        throw new Error('No carer context available');
      }

      console.log('[useCarerInternalContacts] Starting with carer:', {
        staffId: carerContext.staffId,
        organizationId: carerContext.branchInfo.organization_id
      });

      try {
        const recipients: InternalContact[] = [];
        const organizationId = carerContext.branchInfo.organization_id;

        // 1. Fetch all active staff/carers from the same organization (excluding current carer)
        console.log('[useCarerInternalContacts] Fetching staff/carers...');
        const { data: orgStaff, error: staffError } = await supabase
          .from('staff')
          .select('id, first_name, last_name, email, auth_user_id, status')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .not('auth_user_id', 'is', null)
          .neq('id', carerContext.staffId); // Exclude self

        if (staffError) {
          console.error('[useCarerInternalContacts] Error fetching staff:', staffError);
        } else if (orgStaff && orgStaff.length > 0) {
          console.log('[useCarerInternalContacts] Found staff:', orgStaff.length);
          
          orgStaff.forEach((staff) => {
            const firstName = staff.first_name || '';
            const lastName = staff.last_name || '';
            const displayName = `${firstName} ${lastName}`.trim() || 
                              staff.email?.split('@')[0] || 
                              'Staff Member';
            
            recipients.push({
              id: staff.id,
              auth_user_id: staff.auth_user_id,
              name: displayName,
              email: staff.email || undefined,
              type: 'carer',
              groupLabel: 'Carers / Staff'
            });
          });
        }

        // 2. Fetch all branches in the organization
        const { data: orgBranches, error: orgBranchesError } = await supabase
          .from('branches')
          .select('id')
          .eq('organization_id', organizationId);

        if (orgBranchesError) {
          console.error('[useCarerInternalContacts] Error fetching org branches:', orgBranchesError);
        } else if (orgBranches && orgBranches.length > 0) {
          console.log('[useCarerInternalContacts] Found org branches:', orgBranches.length);
          
          const branchIds = orgBranches.map((b) => b.id);
          
          // 3. Get all admin_ids for branches in the org
          const { data: orgAdminBranches, error: orgAdminBranchesError } = await supabase
            .from('admin_branches')
            .select('admin_id')
            .in('branch_id', branchIds);

          if (orgAdminBranchesError) {
            console.error('[useCarerInternalContacts] Error fetching org admin_branches:', orgAdminBranchesError);
          } else if (orgAdminBranches && orgAdminBranches.length > 0) {
            console.log('[useCarerInternalContacts] Found org admin_branches:', orgAdminBranches.length);
            
            const adminIds = [...new Set(orgAdminBranches.map((ab) => ab.admin_id))];
            
            // 4. Get user roles for these admins
            const { data: adminRoles, error: adminRolesError } = await supabase
              .from('user_roles')
              .select('user_id, role')
              .in('user_id', adminIds)
              .in('role', ['branch_admin', 'admin', 'super_admin']);

            if (adminRolesError) {
              console.error('[useCarerInternalContacts] Error fetching admin roles:', adminRolesError);
            } else if (adminRoles && adminRoles.length > 0) {
              console.log('[useCarerInternalContacts] Found admin roles:', adminRoles.length);
              
              // Create a map of user_id to their highest role
              const userRoleMap = new Map<string, string>();
              const roleHierarchy = { 'super_admin': 3, 'admin': 2, 'branch_admin': 1 };
              
              adminRoles.forEach((ar) => {
                const currentRole = userRoleMap.get(ar.user_id);
                if (!currentRole || roleHierarchy[ar.role as keyof typeof roleHierarchy] > roleHierarchy[currentRole as keyof typeof roleHierarchy]) {
                  userRoleMap.set(ar.user_id, ar.role);
                }
              });
              
              const adminUserIds = Array.from(userRoleMap.keys());
              
              // 5. Get profile details for admins
              const { data: adminProfiles, error: adminProfilesError } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, email')
                .in('id', adminUserIds);

              if (adminProfilesError) {
                console.error('[useCarerInternalContacts] Error fetching admin profiles:', adminProfilesError);
              } else if (adminProfiles && adminProfiles.length > 0) {
                console.log('[useCarerInternalContacts] Found admin profiles:', adminProfiles.length);
                
                adminProfiles.forEach((profile) => {
                  const firstName = profile.first_name || '';
                  const lastName = profile.last_name || '';
                  const displayName = `${firstName} ${lastName}`.trim() || 
                                    profile.email?.split('@')[0] || 
                                    'Admin';
                  
                  const role = userRoleMap.get(profile.id) as 'admin' | 'branch_admin' | 'super_admin';
                  const groupLabel = role === 'super_admin' ? 'Super Admins' : 
                                   role === 'admin' ? 'Admins' : 
                                   'Branch Admins';
                  
                  recipients.push({
                    id: profile.id,
                    auth_user_id: profile.id,
                    name: displayName,
                    email: profile.email || undefined,
                    type: role,
                    groupLabel
                  });
                });
              }
            }
          }
        }

        console.log('[useCarerInternalContacts] Total recipients found:', recipients.length);
        
        // Sort by type hierarchy and then by name
        const typeOrder = { 
          'super_admin': 1, 
          'admin': 2, 
          'branch_admin': 3, 
          'carer': 4, 
          'staff': 5 
        };
        
        return recipients.sort((a, b) => {
          const typeCompare = typeOrder[a.type] - typeOrder[b.type];
          if (typeCompare !== 0) return typeCompare;
          return a.name.localeCompare(b.name);
        });
      } catch (error) {
        console.error('Error in useCarerInternalContacts:', error);
        throw error;
      }
    },
    enabled: !!carerContext?.staffId && !!carerContext?.branchInfo?.organization_id,
  });
};

export const useCarerMessageContacts = () => {
  const { carerProfile } = useCarerAuthSafe();
  
  return useQuery({
    queryKey: ['carer-message-contacts', carerProfile?.id, carerProfile?.branchId],
    queryFn: async (): Promise<MessageContact[]> => {
      if (!carerProfile?.id || !carerProfile?.branchId) {
        throw new Error('No carer context available');
      }

      console.log('[useCarerMessageContacts] Starting with carer:', {
        id: carerProfile.id,
        branchId: carerProfile.branchId
      });

      try {
        let clientIds: string[] = [];

        // First try to get client IDs from bookings where this carer is assigned
        const bookingsResponse = await (supabase as any)
          .from('bookings')
          .select('client_id')
          .eq('staff_id', carerProfile.id)
          .not('client_id', 'is', null);

        console.log('[useCarerMessageContacts] Bookings response:', bookingsResponse);

        if (bookingsResponse.data && bookingsResponse.data.length > 0) {
          clientIds = [...new Set<string>(bookingsResponse.data.map((b: any) => b.client_id as string))];
          console.log('[useCarerMessageContacts] Found client IDs from bookings:', clientIds);
        }

        // If no clients from bookings, get all clients from the same branch
        if (clientIds.length === 0) {
          console.log('[useCarerMessageContacts] No bookings found, fetching branch clients');
          
          const branchClientsResponse = await (supabase as any)
            .from('clients')
            .select('id')
            .eq('branch_id', carerProfile.branchId)
            .not('auth_user_id', 'is', null);

          if (branchClientsResponse.data && branchClientsResponse.data.length > 0) {
            clientIds = branchClientsResponse.data.map((c: any) => c.id as string);
            console.log('[useCarerMessageContacts] Found client IDs from branch:', clientIds);
          }
        }

        if (clientIds.length === 0) {
          console.log('[useCarerMessageContacts] No clients found');
          return [];
        }

        // Now fetch client details with auth_user_id
        const clientsResponse = await (supabase as any)
          .from('clients')
          .select('id, first_name, last_name, auth_user_id, branch_id, organization_id')
          .in('id', clientIds)
          .not('auth_user_id', 'is', null)
          .order('first_name');

        console.log('[useCarerMessageContacts] Clients response:', clientsResponse);

        if (clientsResponse.error) {
          console.error('Error fetching clients:', clientsResponse.error);
          throw clientsResponse.error;
        }

        const contacts = (clientsResponse.data || []).map((client: any) => ({
          id: client.id,
          name: `${client.first_name} ${client.last_name}`.trim(),
          auth_user_id: client.auth_user_id,
          branch_id: client.branch_id,
          organization_id: client.organization_id
        }));

        console.log('[useCarerMessageContacts] Final contacts:', contacts);
        return contacts;
      } catch (error) {
        console.error('Error in useCarerMessageContacts:', error);
        throw error;
      }
    },
    enabled: !!carerProfile?.id && !!carerProfile?.branchId,
  });
};