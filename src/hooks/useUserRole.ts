import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'super_admin' | 'branch_admin' | 'carer' | 'client' | 'app_admin';

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
  organizationSlug?: string;
}

export const useUserRole = () => {
  return useQuery<UserWithRole | null>({
    queryKey: ['userRole'],
    queryFn: async (): Promise<UserWithRole | null> => {
      // Add timeout to prevent infinite loading
      const timeout = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('User role query timed out')), 10000)
      );

      const queryPromise = async (): Promise<UserWithRole | null> => {
        // First verify we have an active session - critical for preventing race conditions
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[useUserRole] Session verification failed:', sessionError);
          return null;
        }
        
        if (!session?.user) {
          console.warn('[useUserRole] No active session found, user needs to authenticate');
          return null;
        }

        const user = session.user;
        console.log('[useUserRole] Session verified, checking role for user:', { 
          id: user.id, 
          email: user.email,
          sessionValid: !!session.access_token
        });

        console.log('[useUserRole] Checking role for user:', { id: user.id, email: user.email });

        // Use the new function to get highest priority role
        const { data: roleData, error } = await supabase
          .rpc('get_user_highest_role', { p_user_id: user.id })
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
          
          // Return null instead of throwing to prevent cascade failures
          console.warn('[useUserRole] Returning null due to role lookup failure');
          return null;
        }

        const role = roleData.role as UserRole;
        
        // Get additional user information based on role
        let additionalData: Partial<UserWithRole> = {};
        
        if (role === 'client') {
          // For clients, get client record by auth_user_id
          const { data: clientData } = await supabase
            .from('clients')
            .select('id, first_name, last_name, branch_id')
            .eq('auth_user_id', user.id)
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
          // For carers, get staff record by auth_user_id
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, first_name, last_name, branch_id')
            .eq('auth_user_id', user.id)
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
          
          // For super_admin and branch_admin, fetch organization slug
          const { data: orgMember } = await supabase
            .from('organization_members')
            .select('organization:organizations(slug)')
            .eq('user_id', user.id)
            .limit(1)
            .single();
            
          if (orgMember && orgMember.organization) {
            additionalData.organizationSlug = (orgMember.organization as any).slug;
          }
        }

        return {
          id: user.id,
          email: user.email || '',
          role,
          ...additionalData
        } as UserWithRole;
      };

      try {
        return await Promise.race([queryPromise(), timeout]);
      } catch (error: any) {
        console.error('[useUserRole] Query failed or timed out:', error.message);
        return null; // Return null on timeout or error
      }
    },
    enabled: true,
    retry: 2, // Increase retry count for better reliability
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
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