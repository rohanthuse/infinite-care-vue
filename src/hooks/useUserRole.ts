
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'super_admin' | 'branch_admin' | 'carer' | 'client';

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  branchId?: string;
  clientId?: string;
  staffId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

export const useUserRole = () => {
  return useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[useUserRole] No authenticated user found');
        throw new Error('Not authenticated');
      }

      console.log('[useUserRole] Checking role for user:', { id: user.id, email: user.email });

      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('[useUserRole] Error fetching user role:', {
          error: error.message,
          code: error.code,
          details: error.details,
          userId: user.id,
          email: user.email
        });

        // Enhanced debugging - check what data exists for this user
        const debugInfo = await Promise.allSettled([
          supabase.from('staff').select('id, email, branch_id').eq('id', user.id).single(),
          supabase.from('clients').select('id, email, branch_id').eq('email', user.email).single(),
          supabase.from('admin_branches').select('admin_id, branch_id').eq('admin_id', user.id),
          supabase.from('profiles').select('id, email, first_name, last_name').eq('id', user.id).single()
        ]);

        console.warn('[useUserRole] Debug info for user without role:', {
          userId: user.id,
          email: user.email,
          staff: debugInfo[0].status === 'fulfilled' ? debugInfo[0].value.data : null,
          client: debugInfo[1].status === 'fulfilled' ? debugInfo[1].value.data : null,
          adminBranches: debugInfo[2].status === 'fulfilled' ? debugInfo[2].value.data : null,
          profile: debugInfo[3].status === 'fulfilled' ? debugInfo[3].value.data : null,
        });
        
        throw new Error(`User role not found for ${user.email} (${user.id}). Please contact administrator.`);
      }

      const role = roleData.role as UserRole;
      
      // Get additional user information based on role
      let additionalData: Partial<UserWithRole> = {};
      
      if (role === 'client') {
        // For clients, get client record by email
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, first_name, last_name, branch_id')
          .eq('email', user.email)
          .single();
          
        if (clientData) {
          additionalData = {
            clientId: clientData.id,
            branchId: clientData.branch_id,
            firstName: clientData.first_name,
            lastName: clientData.last_name,
            fullName: `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim()
          };
        }
      } else if (role === 'carer') {
        // For carers, get staff record
        const { data: staffData } = await supabase
          .from('staff')
          .select('id, first_name, last_name, branch_id')
          .eq('id', user.id)
          .single();
          
        if (staffData) {
          additionalData = {
            staffId: staffData.id,
            branchId: staffData.branch_id,
            firstName: staffData.first_name,
            lastName: staffData.last_name,
            fullName: `${staffData.first_name || ''} ${staffData.last_name || ''}`.trim()
          };
        }
      } else if (role === 'branch_admin' || role === 'super_admin') {
        // For admins, get profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          additionalData = {
            firstName: profileData.first_name,
            lastName: profileData.last_name,
            fullName: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
          };
        }
        
        // For branch admins, get their branch access
        if (role === 'branch_admin') {
          const { data: adminBranches } = await supabase
            .from('admin_branches')
            .select('branch_id')
            .eq('admin_id', user.id)
            .limit(1)
            .single();
            
          if (adminBranches) {
            additionalData.branchId = adminBranches.branch_id;
          }
        }
      }

      return {
        id: user.id,
        email: user.email || '',
        role,
        ...additionalData
      } as UserWithRole;
    },
    enabled: true,
    retry: 1,
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
