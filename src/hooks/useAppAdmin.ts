import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useAppAdmin = () => {
  const { user } = useAuth();

  const { data: isAppAdmin, isLoading } = useQuery({
    queryKey: ['user-app-admin-status', user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'app_admin')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking app admin status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user,
  });

  return {
    isAppAdmin: isAppAdmin || false,
    isLoading,
  };
};