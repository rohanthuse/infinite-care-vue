
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      const { data, error } = await supabase
        .from('system_users')
        .select(`
          *,
          system_user_roles:system_user_roles!system_user_roles_system_user_id_fkey(role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((user: any) => ({
        ...user,
        role: user.system_user_roles?.[0]?.role || 'support_admin'
      })) as SystemUser[];
    },
  });
};

export const useSystemUserStats = () => {
  return useQuery({
    queryKey: ['system-user-stats'],
    queryFn: async () => {
      const { data: users, error } = await supabase
        .from('system_users')
        .select(`
          *,
          system_user_roles:system_user_roles!system_user_roles_system_user_id_fkey(role)
        `);

      if (error) throw error;

      const total = users.length;
      const active = users.filter(user => user.is_active).length;
      const inactive = total - active;
      const superAdmins = users.filter(user => 
        user.system_user_roles?.some((role: any) => role.role === 'super_admin')
      ).length;

      return { total, active, inactive, superAdmins };
    },
  });
};

export const useCreateSystemUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userData: CreateSystemUserData) => {
      console.log('[useCreateSystemUser] Creating system user via RPC...');
      const { data, error } = await supabase.rpc('create_system_user_and_role', {
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
