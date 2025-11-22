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
  organizations?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
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

      // The RPC now returns organizations directly as JSONB
      return (data || []).map((user: any) => {
        // Parse organizations from JSONB if present
        const organizations = user.organizations ? 
          (Array.isArray(user.organizations) ? user.organizations : []) : [];

        return {
          ...user,
          role: user.role || 'support_admin',
          organizations,
        };
      }) as SystemUser[];
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
        const msg = result?.error || 'Failed to fetch tenant user stats';
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
        p_role: userData.role as 'super_admin' | 'tenant_manager' | 'support_admin' | 'analytics_viewer',
      });

      if (error) {
        console.error('[useCreateSystemUser] RPC error:', error);
        throw error;
      }

      const result = data as { success: boolean; error?: string; user?: any };
      if (!result?.success) {
        const msg = result?.error || 'Failed to create tenant user';
        console.error('[useCreateSystemUser] RPC returned failure:', msg);
        throw new Error(msg);
      }

      return result.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['system-user-stats'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', 'system-tenants'] });
      toast({
        title: "User Created",
        description: "Tenant user has been created successfully.",
      });
    },
    onError: (error: any) => {
      // Keep toast UX unchanged
      toast({
        title: "Error",
        description: error?.message || "Failed to create tenant user.",
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
      const sessionToken = getSystemSessionToken();
      
      if (!sessionToken) {
        throw new Error('No valid system session found. Please log in again.');
      }

      const { data, error } = await supabase.rpc('toggle_system_user_status_with_session', {
        p_session_token: sessionToken,
        p_user_id: userId,
        p_is_active: isActive
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (result && !result.success) {
        throw new Error(result.error || 'Failed to update user status');
      }
    },
    onMutate: async ({ userId, isActive }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['system-users'] }),
        queryClient.cancelQueries({ queryKey: ['system-user-stats'] }),
      ]);

      const previousUsers = queryClient.getQueryData<SystemUser[]>(['system-users']);
      const previousStats = queryClient.getQueryData<{ total: number; active: number; inactive: number; superAdmins: number }>(['system-user-stats']);

      const prevIsActive = previousUsers?.find(u => u.id === userId)?.is_active;

      if (previousUsers) {
        queryClient.setQueryData<SystemUser[]>(
          ['system-users'],
          previousUsers.map(u => (u.id === userId ? { ...u, is_active: isActive } : u))
        );
      }

      if (previousStats != null && prevIsActive !== undefined && prevIsActive !== isActive) {
        const next = { ...previousStats };
        if (isActive) {
          next.active = Math.max(0, next.active + 1);
          next.inactive = Math.max(0, next.inactive - 1);
        } else {
          next.active = Math.max(0, next.active - 1);
          next.inactive = Math.max(0, next.inactive + 1);
        }
        queryClient.setQueryData(['system-user-stats'], next);
      }

      return { previousUsers, previousStats };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(['system-users'], context.previousUsers);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(['system-user-stats'], context.previousStats);
      }
      toast({
        title: "Error",
        description: error?.message || "Failed to update user status.",
        variant: "destructive",
      });
    },
    onSuccess: (_data, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['system-user-stats'] });
      toast({
        title: "User Updated",
        description: `User has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    },
  });
};

// Update system user (edit profile & role)
export interface UpdateSystemUserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'tenant_manager' | 'support_admin' | 'analytics_viewer';
}

export const useUpdateSystemUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userData: UpdateSystemUserData) => {
      const token = getSystemSessionToken();
      if (!token) {
        console.error('[useUpdateSystemUser] Missing system session token');
        throw new Error('Not authenticated as system admin. Please sign in again.');
      }

      console.log('[useUpdateSystemUser] Updating via RPC update_system_user_with_session...');
      const { data, error } = await supabase.rpc('update_system_user_with_session', {
        p_session_token: token,
        p_user_id: userData.id,
        p_email: userData.email,
        p_first_name: userData.first_name,
        p_last_name: userData.last_name,
        p_role: userData.role as 'super_admin' | 'tenant_manager' | 'support_admin' | 'analytics_viewer',
      });

      if (error) {
        console.error('[useUpdateSystemUser] RPC error:', error);
        throw error;
      }

      const result = data as { success: boolean; error?: string; user?: any };
      if (!result?.success) {
        const msg = result?.error || 'Failed to update tenant user';
        console.error('[useUpdateSystemUser] RPC returned failure:', msg);
        throw new Error(msg);
      }

      return result.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['system-user-stats'] });
      toast({
        title: 'User Updated',
        description: 'Tenant user has been updated successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update tenant user.',
        variant: 'destructive',
      });
    },
  });
};

// Delete system user data interface
interface DeleteSystemUserData {
  userId: string;
}

interface DeleteSystemUserResponse {
  success: boolean;
  message?: string;
  error?: string;
  deleted_user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const useDeleteSystemUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    DeleteSystemUserResponse, 
    Error, 
    DeleteSystemUserData,
    { previousUsers?: SystemUser[]; previousStats?: { total: number; active: number; inactive: number; superAdmins: number } }
  >({
    mutationFn: async ({ userId }) => {
      console.log('[useDeleteSystemUser] Attempting to delete user:', userId);
      
      const token = getSystemSessionToken();
      if (!token) {
        throw new Error('No system session found');
      }

      const { data, error } = await supabase.rpc('delete_system_user_with_session', {
        p_user_id: userId,
        p_session_token: token,
      });

      if (error) {
        console.error('[useDeleteSystemUser] Supabase error:', error);
        throw new Error(error.message || 'Failed to delete tenant user');
      }

      const result = data as unknown as DeleteSystemUserResponse;
      if (!result?.success) {
        console.error('[useDeleteSystemUser] Operation failed:', result?.error);
        throw new Error(result?.error || 'Failed to delete tenant user');
      }

      console.log('[useDeleteSystemUser] User deleted successfully:', result);
      return result;
    },
    
    // Optimistic update - remove user immediately from cache
    onMutate: async ({ userId }) => {
      // Cancel any in-flight queries to prevent race conditions
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['system-users'] }),
        queryClient.cancelQueries({ queryKey: ['system-user-stats'] }),
      ]);

      // Snapshot current state for rollback
      const previousUsers = queryClient.getQueryData<SystemUser[]>(['system-users']);
      const previousStats = queryClient.getQueryData<{ total: number; active: number; inactive: number; superAdmins: number }>(['system-user-stats']);

      // Find the user being deleted
      const userToDelete = previousUsers?.find(u => u.id === userId);

      // Optimistically remove from cache
      if (previousUsers) {
        queryClient.setQueryData<SystemUser[]>(
          ['system-users'],
          previousUsers.filter(u => u.id !== userId)
        );
      }

      // Update stats optimistically
      if (previousStats && userToDelete) {
        const updatedStats = { ...previousStats };
        updatedStats.total = Math.max(0, updatedStats.total - 1);
        
        if (userToDelete.is_active) {
          updatedStats.active = Math.max(0, updatedStats.active - 1);
        } else {
          updatedStats.inactive = Math.max(0, updatedStats.inactive - 1);
        }
        
        if (userToDelete.role === 'super_admin') {
          updatedStats.superAdmins = Math.max(0, updatedStats.superAdmins - 1);
        }
        
        queryClient.setQueryData(['system-user-stats'], updatedStats);
      }

      return { previousUsers, previousStats };
    },
    
    onSuccess: (data) => {
      // Force immediate refetch instead of just invalidating
      queryClient.refetchQueries({ queryKey: ['system-users'] });
      queryClient.refetchQueries({ queryKey: ['system-user-stats'] });
      
      // Show success toast
      toast({
        title: "Success",
        description: `Tenant user ${data.deleted_user?.name || 'user'} has been deleted successfully.`,
        variant: "default",
      });
    },
    
    onError: (error: Error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousUsers) {
        queryClient.setQueryData(['system-users'], context.previousUsers);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(['system-user-stats'], context.previousStats);
      }
      
      console.error('[useDeleteSystemUser] Delete failed:', error.message);
      
      // Show specific error toast based on error message
      let description = 'An unexpected error occurred while deleting the user.';
      
      if (error.message.includes('Cannot delete your own account')) {
        description = 'You cannot delete your own account.';
      } else if (error.message.includes('Cannot delete the last super admin')) {
        description = 'Cannot delete the last super admin user in the system.';
      } else if (error.message.includes('Insufficient permissions')) {
        description = 'You do not have permission to delete tenant users.';
      } else if (error.message.includes('Invalid or expired session')) {
        description = 'Your session has expired. Please log in again.';
      } else if (error.message.includes('User not found')) {
        description = 'The user you are trying to delete does not exist.';
      }
      
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    },
  });
};
