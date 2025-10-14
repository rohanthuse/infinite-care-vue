import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StaffCareerHighlight {
  id: string;
  staff_id: string;
  title: string;
  description: string;
  achieved_date: string;
  highlight_type: 'award' | 'achievement' | 'certification' | 'milestone';
  color: string;
  created_at: string;
  updated_at: string;
}

export const useStaffCareerHighlights = (staffId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['staff-career-highlights', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_career_highlights')
        .select('*')
        .eq('staff_id', staffId)
        .order('achieved_date', { ascending: false });
      
      if (error) throw error;
      return data as StaffCareerHighlight[];
    },
    enabled: !!staffId,
  });

  const addMutation = useMutation({
    mutationFn: async (highlight: Omit<StaffCareerHighlight, 'id' | 'staff_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('staff_career_highlights')
        .insert({
          staff_id: staffId,
          ...highlight,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-career-highlights', staffId] });
      toast({
        title: 'Highlight added',
        description: 'Career highlight has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add highlight: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (highlightId: string) => {
      const { error } = await supabase
        .from('staff_career_highlights')
        .delete()
        .eq('id', highlightId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-career-highlights', staffId] });
      toast({
        title: 'Highlight deleted',
        description: 'Career highlight has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete highlight: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    highlights: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addHighlight: addMutation.mutate,
    deleteHighlight: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
