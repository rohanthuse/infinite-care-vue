
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole, canCommunicateWith, type UserRole } from './useUserRole';
import { useTenant } from '@/contexts/TenantContext';

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  unread: number;
  type: UserRole;
  branchId?: string;
}

export const useContacts = (branchId: string, contactType: string = 'all') => {
  const { data: currentUser } = useUserRole();
  const { organization } = useTenant();

  return useQuery({
    queryKey: ['contacts', branchId, contactType, currentUser?.role, organization?.id],
    queryFn: async () => {
      if (!currentUser || !organization) {
        console.log('No current user or organization found for contacts');
        return [];
      }

      console.log('Fetching contacts for user:', currentUser.id, 'role:', currentUser.role, 'contactType:', contactType, 'org:', organization.id);
      
      // Use Map to deduplicate contacts by user ID
      const contactsMap = new Map<string, Contact>();

      // Get staff (carers and admins) - filter by organization first
      if (contactType === 'all' || contactType === 'carers' || contactType === 'admins') {
        const { data: staff, error: staffError } = await supabase
          .from('staff')
          .select(`
            id,
            first_name,
            last_name,
            status,
            branch_id,
            branches!inner (
              id,
              organization_id
            )
          `)
          .eq('branch_id', branchId)
          .eq('status', 'Active')
          .eq('branches.organization_id', organization.id);

        if (staffError) {
          console.error('Error fetching staff:', staffError);
          throw staffError;
        }

        console.log('Found staff members:', staff?.length || 0);

        if (staff && staff.length > 0) {
          // Get roles for staff members
          const staffIds = staff.map(s => s.id);
          const { data: staffRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('user_id', staffIds);

          if (rolesError) {
            console.error('Error fetching staff roles:', rolesError);
          }

          console.log('Found staff roles:', staffRoles?.length || 0);

          staff.forEach(member => {
            // Get all roles for this staff member
            const userRoles = staffRoles?.filter(r => r.user_id === member.id).map(r => r.role as UserRole) || [];
            
            // If no roles found, assume 'carer' for staff members (fallback)
            const allRoles = userRoles.length > 0 ? userRoles : ['carer' as UserRole];
            
            // Determine the highest priority role to display (admin > carer)
            const priorityOrder: UserRole[] = ['super_admin', 'branch_admin', 'carer'];
            const displayRole = allRoles.find(role => priorityOrder.includes(role)) || 'carer';
            
            console.log(`Staff member ${member.first_name} ${member.last_name} (${member.id}): roles = [${allRoles.join(', ')}], display = ${displayRole}`);
            
            // Check if current user can communicate with this staff member
            if (canCommunicateWith(currentUser.role, displayRole)) {
              const shouldInclude = 
                contactType === 'all' ||
                (contactType === 'carers' && allRoles.includes('carer')) ||
                (contactType === 'admins' && allRoles.some(role => role === 'super_admin' || role === 'branch_admin'));

              if (shouldInclude) {
                // Only add if not already in map (deduplicate by user ID)
                if (!contactsMap.has(member.id)) {
                  contactsMap.set(member.id, {
                    id: member.id,
                    name: `${member.last_name}, ${member.first_name}`,
                    avatar: `${member.first_name[0]}${member.last_name[0]}`,
                    status: member.status === 'Active' ? 'online' : 'offline',
                    unread: 0, // TODO: Calculate actual unread count
                    type: displayRole,
                    branchId: branchId
                  });
                }
              }
            } else {
              console.log(`User ${currentUser.role} cannot communicate with ${displayRole} ${member.first_name} ${member.last_name}`);
            }
          });
        }
      }

      // Get clients (only if user can communicate with clients) - filter by organization
      if ((contactType === 'all' || contactType === 'clients') && 
          (currentUser.role === 'super_admin' || currentUser.role === 'branch_admin')) {
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            status,
            branch_id,
            branches!inner (
              id,
              organization_id
            )
          `)
          .eq('branch_id', branchId)
          .eq('branches.organization_id', organization.id);

        if (clientsError) {
          console.error('Error fetching clients:', clientsError);
          throw clientsError;
        }

        console.log('Found clients:', clients?.length || 0);

        clients?.forEach(client => {
          // Only add if not already in map (deduplicate by user ID)
          if (!contactsMap.has(client.id)) {
            contactsMap.set(client.id, {
              id: client.id,
              name: `${client.last_name}, ${client.first_name}`,
              avatar: `${client.first_name[0]}${client.last_name[0]}`,
              status: client.status === 'Active' ? 'online' : 'offline',
              unread: 0, // TODO: Calculate actual unread count
              type: 'client',
              branchId: branchId
            });
          }
        });
      }

      // Convert Map to array
      const contacts = Array.from(contactsMap.values());
      console.log('Final contacts list:', contacts.length, 'contacts (deduplicated)');
      return contacts;
    },
    enabled: !!currentUser && !!organization,
  });
};
