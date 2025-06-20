
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
      if (!currentUser) return [];

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

        if (staffError) throw staffError;

        // Get roles for staff members
        const staffIds = staff?.map(s => s.id) || [];
        const { data: staffRoles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', staffIds);

        staff?.forEach(member => {
          const roleData = staffRoles?.find(r => r.user_id === member.id);
          const memberRole = roleData?.role as UserRole;
          
          // Check if current user can communicate with this staff member
          if (memberRole && canCommunicateWith(currentUser.role, memberRole)) {
            const shouldInclude = 
              contactType === 'all' ||
              (contactType === 'carers' && memberRole === 'carer') ||
              (contactType === 'admins' && (memberRole === 'super_admin' || memberRole === 'branch_admin'));

            if (shouldInclude) {
              contacts.push({
                id: member.id,
                name: `${member.last_name}, ${member.first_name}`,
                avatar: `${member.first_name[0]}${member.last_name[0]}`,
                status: member.status === 'Active' ? 'online' : 'offline',
                unread: 0, // TODO: Calculate actual unread count
                type: memberRole,
                branchId: branchId
              });
            }
          }
        });
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

        if (clientsError) throw clientsError;

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

      return contacts;
    },
    enabled: !!currentUser,
  });
};
