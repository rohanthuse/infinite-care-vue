import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CreateImprovementAreaData {
  staff_id: string;
  branch_id: string;
  area_title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: string;
  action_plan?: string;
  target_completion_date?: string;
  support_required?: string;
  training_recommended?: boolean;
  source_type?: string;
  source_reference_id?: string;
}

export const useStaffImprovementAreas = (staffId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Query to fetch improvement areas
  const query = useQuery({
    queryKey: ['staff-improvement-areas', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_improvement_areas')
        .select('*')
        .eq('staff_id', staffId)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!staffId,
  });
  
  // Mutation to create improvement area
  const createMutation = useMutation({
    mutationFn: async (data: CreateImprovementAreaData) => {
      const { data: result, error } = await supabase
        .from('staff_improvement_areas')
        .insert({
          ...data,
          identified_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-improvement-areas', staffId] });
      queryClient.invalidateQueries({ queryKey: ['staff-quality', staffId] });
      toast({
        title: 'Success',
        description: 'Improvement area added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add improvement area',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation to update improvement area
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { data: result, error } = await supabase
        .from('staff_improvement_areas')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-improvement-areas', staffId] });
      queryClient.invalidateQueries({ queryKey: ['staff-quality', staffId] });
      toast({
        title: 'Success',
        description: 'Improvement area updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update improvement area',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation to delete improvement area
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_improvement_areas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-improvement-areas', staffId] });
      queryClient.invalidateQueries({ queryKey: ['staff-quality', staffId] });
      toast({
        title: 'Success',
        description: 'Improvement area deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete improvement area',
        variant: 'destructive',
      });
    },
  });
  
  return {
    improvementAreas: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createImprovementArea: createMutation.mutate,
    updateImprovementArea: updateMutation.mutate,
    deleteImprovementArea: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
