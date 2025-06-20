
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole, canCommunicateWith, type UserRole } from './useUserRole';

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

  return useQuery({
    queryKey: ['contacts', branchId, contactType, currentUser?.role],
    queryFn: async () => {
      if (!currentUser) {
        console.log('No current user found for contacts');
        return [];
      }

      console.log('Fetching contacts for user:', currentUser.id, 'role:', currentUser.role, 'contactType:', contactType);
      const contacts: Contact[] = [];

      // Get staff (carers and admins)
      if (contactType === 'all' || contactType === 'carers' || contactType === 'admins') {
        const { data: staff, error: staffError } = await supabase
          .from('staff')
          .select(`
            id,
            first_name,
            last_name,
            status
          `)
          .eq('branch_id', branchId)
          .eq('status', 'Active');

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
            const roleData = staffRoles?.find(r => r.user_id === member.id);
            const memberRole = roleData?.role as UserRole;
            
            // If no role found, assume 'carer' for staff members (fallback)
            const effectiveRole = memberRole || 'carer';
            
            console.log(`Staff member ${member.first_name} ${member.last_name} (${member.id}): role = ${effectiveRole}`);
            
            // Check if current user can communicate with this staff member
            if (canCommunicateWith(currentUser.role, effectiveRole)) {
              const shouldInclude = 
                contactType === 'all' ||
                (contactType === 'carers' && effectiveRole === 'carer') ||
                (contactType === 'admins' && (effectiveRole === 'super_admin' || effectiveRole === 'branch_admin'));

              if (shouldInclude) {
                contacts.push({
                  id: member.id,
                  name: `${member.last_name}, ${member.first_name}`,
                  avatar: `${member.first_name[0]}${member.last_name[0]}`,
                  status: member.status === 'Active' ? 'online' : 'offline',
                  unread: 0, // TODO: Calculate actual unread count
                  type: effectiveRole,
                  branchId: branchId
                });
              }
            } else {
              console.log(`User ${currentUser.role} cannot communicate with ${effectiveRole} ${member.first_name} ${member.last_name}`);
            }
          });
        }
      }

      // Get clients (only if user can communicate with clients)
      if ((contactType === 'all' || contactType === 'clients') && 
          (currentUser.role === 'super_admin' || currentUser.role === 'branch_admin')) {
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            status
          `)
          .eq('branch_id', branchId);

        if (clientsError) {
          console.error('Error fetching clients:', clientsError);
          throw clientsError;
        }

        console.log('Found clients:', clients?.length || 0);

        clients?.forEach(client => {
          contacts.push({
            id: client.id,
            name: `${client.last_name}, ${client.first_name}`,
            avatar: `${client.first_name[0]}${client.last_name[0]}`,
            status: client.status === 'Active' ? 'online' : 'offline',
            unread: 0, // TODO: Calculate actual unread count
            type: 'client',
            branchId: branchId
          });
        });
      }

      console.log('Final contacts list:', contacts.length, 'contacts');
      return contacts;
    },
    enabled: !!currentUser,
  });
};
