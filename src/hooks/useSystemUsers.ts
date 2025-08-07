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
          system_user_roles(role)
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
          system_user_roles(role)
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
      // First create the system user
      const { data: newUser, error: userError } = await supabase
        .from('system_users')
        .insert({
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          encrypted_password: userData.password, // In production, this should be hashed
          is_active: true
        })
        .select()
        .single();

      if (userError) throw userError;

      // Then create the role assignment
      const { error: roleError } = await supabase
        .from('system_user_roles')
        .insert({
          system_user_id: newUser.id,
          role: userData.role
        });

      if (roleError) throw roleError;

      return newUser;
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
        description: error.message || "Failed to create system user.",
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