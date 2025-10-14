import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StaffReference {
  id: string;
  staff_id: string;
  name: string;
  position: string;
  company: string;
  relationship: string;
  contact_date: string;
  rating: number;
  statement: string;
  created_at: string;
  updated_at: string;
}

export const useStaffReferences = (staffId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['staff-references', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_references')
        .select('*')
        .eq('staff_id', staffId)
        .order('contact_date', { ascending: false });
      
      if (error) throw error;
      return data as StaffReference[];
    },
    enabled: !!staffId,
  });

  const addMutation = useMutation({
    mutationFn: async (reference: Omit<StaffReference, 'id' | 'staff_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('staff_references')
        .insert({
          staff_id: staffId,
          ...reference,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-references', staffId] });
      toast({
        title: 'Reference added',
        description: 'Professional reference has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add reference: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (referenceId: string) => {
      const { error } = await supabase
        .from('staff_references')
        .delete()
        .eq('id', referenceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-references', staffId] });
      toast({
        title: 'Reference deleted',
        description: 'Professional reference has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete reference: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    references: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addReference: addMutation.mutate,
    deleteReference: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
