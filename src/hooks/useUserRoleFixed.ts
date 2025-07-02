
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'super_admin' | 'branch_admin' | 'carer' | 'client';

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  branchId?: string;
}

export const useUserRoleFixed = () => {
  return useQuery({
    queryKey: ['userRoleFixed'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First, try to get role from database
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('[useUserRoleFixed] Error fetching user role:', error);
        
        // Fallback: Check if user is a client by looking at localStorage or clients table
        const userType = localStorage.getItem("userType");
        const clientId = localStorage.getItem("clientId");
        
        if (userType === "client" && clientId) {
          console.log('[useUserRoleFixed] Using client role from localStorage');
          return {
            id: user.id,
            email: user.email || '',
            role: 'client' as UserRole,
          };
        }
        
        // Try to check if user is a client in the database
        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (clientData) {
          console.log('[useUserRoleFixed] Found client in database, assigning client role');
          
          // Ensure client role exists in user_roles
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'client'
            })
            .select()
            .single();
          
          if (!insertError) {
            return {
              id: user.id,
              email: user.email || '',
              role: 'client' as UserRole,
            };
          }
        }
        
        // If all else fails, check if user is staff
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('id', user.id)
          .single();
        
        if (staffData) {
          console.warn('[useUserRoleFixed] Staff member found without role assignment:', user.id);
          return {
            id: user.id,
            email: user.email || '',
            role: 'carer' as UserRole,
          };
        }
        
        throw new Error('User role not found');
      }

      return {
        id: user.id,
        email: user.email || '',
        role: roleData.role as UserRole,
      };
    },
    enabled: true,
    retry: 2,
    staleTime: 300000, // 5 minutes
  });
};

export const canCommunicateWith = (userRole: UserRole, targetRole: UserRole): boolean => {
  // Super admin and branch admin can communicate with everyone
  if (userRole === 'super_admin' || userRole === 'branch_admin') {
    return true;
  }

  // Carers can only communicate with admins (not clients directly)
  if (userRole === 'carer') {
    return targetRole === 'super_admin' || targetRole === 'branch_admin';
  }

  // Clients can only communicate with admins (not carers directly)
  if (userRole === 'client') {
    return targetRole === 'super_admin' || targetRole === 'branch_admin';
  }

  return false;
};
