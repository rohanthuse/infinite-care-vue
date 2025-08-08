import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getSystemSessionToken } from '@/utils/systemSession';

interface SystemUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  role?: string;
}

interface CreateSystemUserData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: 'super_admin' | 'tenant_manager' | 'support_admin' | 'analytics_viewer';
}

export const useSystemUsers = () => {
  return useQuery({
    queryKey: ['system-users'],
    queryFn: async () => {
      const token = getSystemSessionToken();
      if (!token) {
        console.error('[useSystemUsers] Missing system session token');
        throw new Error('Not authenticated as system admin. Please sign in again.');
      }

      console.log('[useSystemUsers] Fetching via RPC list_system_users_with_session');
      const { data, error } = await supabase.rpc('list_system_users_with_session', {
        p_session_token: token,
      });

      if (error) {
        console.error('[useSystemUsers] RPC error:', error);
        throw error;
      }

      // data is a table-returning RPC (array of rows)
      return (data || []).map((user: any) => ({
        ...user,
        role: user.role || 'support_admin',
      })) as SystemUser[];
    },
  });
};

export const useSystemUserStats = () => {
  return useQuery({
    queryKey: ['system-user-stats'],
    queryFn: async () => {
      const token = getSystemSessionToken();
      if (!token) {
        console.error('[useSystemUserStats] Missing system session token');
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

      const result = data as any;
      if (!result?.success) {
        const msg = result?.error || 'Failed to fetch system user stats';
        console.error('[useSystemUserStats] RPC returned failure:', msg);
        throw new Error(msg);
      }

      return {
        total: result.total || 0,
        active: result.active || 0,
        inactive: result.inactive || 0,
        superAdmins: result.superAdmins || 0,
      };
    },
  });
};

export const useCreateSystemUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userData: CreateSystemUserData) => {
      const token = getSystemSessionToken();
      if (!token) {
        console.error('[useCreateSystemUser] Missing system session token');
        throw new Error('Not authenticated as system admin. Please sign in again.');
      }

      console.log('[useCreateSystemUser] Creating via RPC create_system_user_and_role_with_session...');
      const { data, error } = await supabase.rpc('create_system_user_and_role_with_session', {
        p_session_token: token,
        p_email: userData.email,
        p_password: userData.password,
        p_first_name: userData.first_name,
        p_last_name: userData.last_name,
        p_role: userData.role,
      });

      if (error) {
        console.error('[useCreateSystemUser] RPC error:', error);
        throw error;
      }

      const result = data as { success: boolean; error?: string; user?: any };
      if (!result?.success) {
        const msg = result?.error || 'Failed to create system user';
        console.error('[useCreateSystemUser] RPC returned failure:', msg);
        throw new Error(msg);
      }

      return result.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['system-user-stats'] });
      toast({
        title: "User Created",
        description: "System user has been created successfully.",
      });
    },
    onError: (error: any) => {
      // Keep toast UX unchanged
      toast({
        title: "Error",
        description: error?.message || "Failed to create system user.",
        variant: "destructive",
      });
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('system_users')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['system-user-stats'] });
      toast({
        title: "User Updated",
        description: `User has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status.",
        variant: "destructive",
      });
    },
  });
};
