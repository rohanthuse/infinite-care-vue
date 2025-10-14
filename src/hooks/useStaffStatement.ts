import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StaffStatement {
  id: string;
  staff_id: string;
  statement: string;
  created_at: string;
  updated_at: string;
}

export const useStaffStatement = (staffId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['staff-statement', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_statements')
        .select('*')
        .eq('staff_id', staffId)
        .maybeSingle();
      
      if (error) throw error;
      return data as StaffStatement | null;
    },
    enabled: !!staffId,
  });

  const updateMutation = useMutation({
    mutationFn: async (statement: string) => {
      const { data, error } = await supabase
        .from('staff_statements')
        .upsert({
          staff_id: staffId,
          statement,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-statement', staffId] });
      toast({
        title: 'Statement updated',
        description: 'Your personal statement has been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update statement: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    statement: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateStatement: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
