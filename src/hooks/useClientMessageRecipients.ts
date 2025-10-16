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
      if (!clientId || !organization) {
        console.log('[useClientMessageRecipients] Missing clientId or organization');
        return [];
      }

      const recipients: ClientMessageRecipient[] = [];

      try {
        // 1. Get client details to find their branch
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id, branch_id, auth_user_id')
          .eq('id', clientId)
          .single();

        if (clientError || !client) {
          console.error('[useClientMessageRecipients] Client not found:', clientError);
          return [];
        }

        const clientBranchId = client.branch_id;

        // 2. Get assigned carers for this client from bookings
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('staff_id')
          .eq('client_id', clientId)
          .not('staff_id', 'is', null);

        if (!bookingsError && bookings) {
          const staffIds = [...new Set(bookings.map(b => b.staff_id).filter(Boolean))];
          
          if (staffIds.length > 0) {
            const { data: staffDetails, error: staffError } = await supabase
              .from('staff')
              .select('id, auth_user_id, first_name, last_name, email')
              .in('id', staffIds);
            
            if (!staffError && staffDetails) {
              staffDetails.forEach(carer => {
                const firstName = carer.first_name || '';
                const lastName = carer.last_name || '';
                const displayName = `${firstName} ${lastName}`.trim() || 
                                   carer.email?.split('@')[0] || 
                                   `Carer ${carer.id.slice(0, 8)}`;
                
                recipients.push({
                  id: carer.id,
                  auth_user_id: carer.auth_user_id,
                  name: displayName,
                  avatar: `${firstName.charAt(0) || 'C'}${lastName.charAt(0) || 'R'}`,
                  type: 'assigned_carer',
                  email: carer.email,
                  canMessage: true,
                  groupLabel: 'Assigned Carers'
                });
              });
            }
          }
        }

        // 3. Get branch admins for this client's branch
        const { data: branchAdmins, error: branchAdminsError } = await supabase
          .from('admin_branches')
          .select(`
            admin_id,
            branches!inner (
              id,
              organization_id
            )
          `)
          .eq('branch_id', clientBranchId)
          .eq('branches.organization_id', organization.id);

        if (!branchAdminsError && branchAdmins) {
          const adminIds = branchAdmins.map(ab => ab.admin_id);
          
          const { data: adminUsers, error: adminUsersError } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('user_id', adminIds)
            .eq('role', 'branch_admin');

          if (!adminUsersError && adminUsers) {
            const userIds = adminUsers.map((u: any) => u.user_id);
            
            if (userIds.length > 0) {
              const { data: adminDetails, error: adminDetailsError } = await supabase
                .rpc('get_admin_user_details', { user_ids: userIds });
              
              if (!adminDetailsError && adminDetails) {
                adminDetails.forEach(admin => {
                  const firstName = admin.first_name || '';
                  const lastName = admin.last_name || '';
                  const displayName = `${firstName} ${lastName}`.trim() || 
                                     admin.email?.split('@')[0] || 
                                     `Branch Admin ${admin.id.slice(0, 8)}`;
                  
                  recipients.push({
                    id: admin.id,
                    auth_user_id: admin.id,
                    name: displayName,
                    avatar: `${firstName.charAt(0) || 'B'}${lastName.charAt(0) || 'A'}`,
                    type: 'branch_admin',
                    email: admin.email,
                    canMessage: true,
                    groupLabel: 'Branch Admins'
                  });
                });
              }
            }
          }
        }

        // 4. Get super admins who have access to this organization
        const { data: orgSuperAdminBranches } = await supabase
          .from('admin_branches')
          .select(`
            admin_id,
            branches!inner (
              id,
              organization_id
            )
          `)
          .eq('branches.organization_id', organization.id);

        if (orgSuperAdminBranches) {
          const orgSuperAdminIds = [...new Set(orgSuperAdminBranches.map(ab => ab.admin_id))];
          
          const { data: superAdminRoles } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'super_admin')
            .in('user_id', orgSuperAdminIds);

          if (superAdminRoles) {
            const superAdminIds = superAdminRoles.map((r: any) => r.user_id);
            
            if (superAdminIds.length > 0) {
              const { data: adminDetails, error: adminDetailsError } = await supabase
                .rpc('get_admin_user_details', { user_ids: superAdminIds });
              
              if (!adminDetailsError && adminDetails) {
                adminDetails.forEach(admin => {
                  const firstName = admin.first_name || '';
                  const lastName = admin.last_name || '';
                  const displayName = `${firstName} ${lastName}`.trim() || 
                                     admin.email?.split('@')[0] || 
                                     `Super Admin ${admin.id.slice(0, 8)}`;
                  
                  recipients.push({
                    id: admin.id,
                    auth_user_id: admin.id,
                    name: displayName,
                    avatar: `${firstName.charAt(0) || 'S'}${lastName.charAt(0) || 'A'}`,
                    type: 'super_admin',
                    email: admin.email,
                    canMessage: true,
                    groupLabel: 'Super Admins'
                  });
                });
              }
            }
          }
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
