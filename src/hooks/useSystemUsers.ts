import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SystemUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  organizations?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  selectedOrganization?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  is_active?: boolean;
  last_login_at?: string;
  created_at?: string;
}

export interface CreateSystemUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
}

export const useSystemUsers = () => {
  return useQuery({
    queryKey: ['system-users'],
    queryFn: async () => {
      console.log('[useSystemUsers] Starting to fetch system users');
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('[useSystemUsers] No session token found');
        throw new Error('Not authenticated as system admin. Please sign in again.');
      }

      console.log('[useSystemUsers] Fetching system users via RPC (then organizations separately)');
      
      // Use the working RPC to get system users data
      const { data: systemUsers, error: usersError } = await supabase.rpc('list_system_users_with_session', {
        p_session_token: token,
      });

      if (usersError) {
        console.error('[useSystemUsers] RPC error:', usersError);
        throw usersError;
      }

      console.log('[useSystemUsers] System users fetched:', systemUsers);

      if (!systemUsers || systemUsers.length === 0) {
        return [];
      }

      // Get organization associations for all users
      const userIds = systemUsers.map(user => user.id);
      const { data: userOrgAssociations, error: orgError } = await supabase
        .from('system_user_organizations')
        .select(`
          system_user_id,
          is_primary,
          organization:organizations(
            id,
            name,
            slug
          )
        `)
        .in('system_user_id', userIds);

      if (orgError) {
        console.error('[useSystemUsers] Error fetching organization associations:', orgError);
      }

      console.log('[useSystemUsers] Organization associations:', userOrgAssociations);

      // Map organizations to users
      const usersWithOrganizations = systemUsers.map((user: any) => {
        const userAssociations = (userOrgAssociations || [])
          .filter((assoc: any) => assoc.system_user_id === user.id);
        
        console.log(`[useSystemUsers] User ${user.email} associations:`, userAssociations);
        
        const userOrgs = userAssociations
          .map((assoc: any) => assoc.organization)
          .filter(Boolean);
        
        const primaryOrg = userAssociations
          .find((assoc: any) => assoc.is_primary)?.organization || null;
          
        console.log(`[useSystemUsers] User ${user.email} primary org:`, primaryOrg);
        console.log(`[useSystemUsers] User ${user.email} all orgs:`, userOrgs);

        const finalUser = {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role || 'support_admin',
          organizations: userOrgs,
          selectedOrganization: primaryOrg,
          is_active: user.is_active,
          last_login_at: user.last_login_at,
          created_at: user.created_at,
        };
        
        console.log(`[useSystemUsers] Final user object for ${user.email}:`, finalUser);
        return finalUser;
      });

      return usersWithOrganizations as SystemUser[];
    },
  });
};

export const useSystemUserStats = () => {
  return useQuery({
    queryKey: ['system-user-stats'],
    queryFn: async () => {
      console.log('[useSystemUserStats] Fetching system user stats');
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('[useSystemUserStats] No session token found');
        throw new Error('Not authenticated as system admin. Please sign in again.');
      }

      console.log('[useSystemUserStats] Fetching via RPC get_system_user_stats_with_session');
      const { data, error } = await supabase.rpc('get_system_user_stats_with_session', {
        p_session_token: token,
      });

      if (error) {
        console.error('[useSystemUserStats] RPC error:', error);
        throw error;
      }

      console.log('[useSystemUserStats] Stats fetched:', data);
      return data || {
        total: 0,
        active: 0,
        inactive: 0,
        super_admins: 0,
      };
    },
  });
};

export const useCreateSystemUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateSystemUserData) => {
      console.log('[useCreateSystemUser] Creating system user:', userData);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('[useCreateSystemUser] No session token found');
        throw new Error('Not authenticated as system admin. Please sign in again.');
      }

      console.log('[useCreateSystemUser] Calling RPC create_system_user_and_role_with_session');
      const { data, error } = await supabase.rpc('create_system_user_and_role_with_session', {
        p_session_token: token,
        p_email: userData.email,
        p_password: userData.password,
        p_first_name: userData.first_name,
        p_last_name: userData.last_name,
        p_role: userData.role as any,
      });

      if (error) {
        console.error('[useCreateSystemUser] RPC error:', error);
        throw error;
      }

      if (!(data as any)?.success) {
        console.error('[useCreateSystemUser] RPC returned failure:', data);
        throw new Error((data as any)?.error || 'Failed to create system user');
      }

      console.log('[useCreateSystemUser] User created successfully:', data);
      return data;
    },
    onSuccess: () => {
      toast.success('System user created successfully');
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['system-user-stats'] });
    },
    onError: (error: Error) => {
      console.error('[useCreateSystemUser] Mutation error:', error);
      toast.error(`Failed to create user: ${error.message}`);
    }
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      console.log('[useToggleUserStatus] Toggling user status:', { userId, isActive });
      
      const { data, error } = await supabase
        .from('system_users')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('[useToggleUserStatus] Database error:', error);
        throw error;
      }

      console.log('[useToggleUserStatus] Status updated successfully:', data);
      return data;
    },
    onMutate: async ({ userId, isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['system-users'] });
      await queryClient.cancelQueries({ queryKey: ['system-user-stats'] });

      // Snapshot the previous values
      const previousUsers = queryClient.getQueryData(['system-users']);
      const previousStats = queryClient.getQueryData(['system-user-stats']);

      // Optimistically update the user list
      queryClient.setQueryData(['system-users'], (old: SystemUser[] | undefined) => {
        if (!old) return old;
        return old.map(user => 
          user.id === userId ? { ...user, is_active: isActive } : user
        );
      });

      // Optimistically update the stats
      queryClient.setQueryData(['system-user-stats'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          active: isActive ? old.active + 1 : old.active - 1,
          inactive: isActive ? old.inactive - 1 : old.inactive + 1,
        };
      });

      return { previousUsers, previousStats };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(['system-users'], context.previousUsers);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(['system-user-stats'], context.previousStats);
      }
      
      console.error('[useToggleUserStatus] Error toggling user status:', err);
      toast.error(`Failed to ${variables.isActive ? 'activate' : 'deactivate'} user: ${err.message}`);
    },
    onSuccess: (data, { isActive }) => {
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['system-user-stats'] });
    },
  });
};

export interface UpdateSystemUserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export const useUpdateSystemUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: UpdateSystemUserData) => {
      console.log('[useUpdateSystemUser] Updating system user:', userData);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('[useUpdateSystemUser] No session token found');
        throw new Error('Not authenticated as system admin. Please sign in again.');
      }

      console.log('[useUpdateSystemUser] Calling RPC update_system_user_with_session');
      const { data, error } = await supabase.rpc('update_system_user_with_session', {
        p_session_token: token,
        p_user_id: userData.id,
        p_email: userData.email,
        p_first_name: userData.first_name,
        p_last_name: userData.last_name,
        p_role: userData.role as any,
      });

      if (error) {
        console.error('[useUpdateSystemUser] RPC error:', error);
        throw error;
      }

      if (!(data as any)?.success) {
        console.error('[useUpdateSystemUser] RPC returned failure:', data);
        throw new Error((data as any)?.error || 'Failed to update system user');
      }

      console.log('[useUpdateSystemUser] User updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      toast.success('System user updated successfully');
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
    },
    onError: (error: Error) => {
      console.error('[useUpdateSystemUser] Mutation error:', error);
      toast.error(`Failed to update user: ${error.message}`);
    }
  });
};