import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StaffEmploymentHistory {
  id: string;
  staff_id: string;
  position: string;
  employer: string;
  location: string;
  start_date: string;
  end_date: string | null;
  status: 'current' | 'completed';
  responsibilities: string[];
  created_at: string;
  updated_at: string;
}

export type NewEmploymentHistory = Omit<StaffEmploymentHistory, 'id' | 'created_at' | 'updated_at' | 'staff_id'>;

export const useStaffEmploymentHistory = (staffId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employmentHistory = [], isLoading } = useQuery({
    queryKey: ['staff-employment-history', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_employment_history')
        .select('*')
        .eq('staff_id', staffId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as StaffEmploymentHistory[];
    },
    enabled: !!staffId,
  });

  const addEmploymentMutation = useMutation({
    mutationFn: async (employmentData: NewEmploymentHistory) => {
      const { data, error } = await supabase
        .from('staff_employment_history')
        .insert({
          staff_id: staffId,
          ...employmentData,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-employment-history', staffId] });
      toast({
        title: "Success",
        description: "Employment record added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add employment record: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateEmploymentMutation = useMutation({
    mutationFn: async ({ id, ...employmentData }: Partial<StaffEmploymentHistory> & { id: string }) => {
      const { data, error } = await supabase
        .from('staff_employment_history')
        .update(employmentData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-employment-history', staffId] });
      toast({
        title: "Success",
        description: "Employment record updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update employment record: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteEmploymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_employment_history')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-employment-history', staffId] });
      toast({
        title: "Success",
        description: "Employment record deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete employment record: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    employmentHistory,
    isLoading,
    addEmployment: addEmploymentMutation.mutate,
    updateEmployment: updateEmploymentMutation.mutate,
    deleteEmployment: deleteEmploymentMutation.mutate,
    isAdding: addEmploymentMutation.isPending,
    isUpdating: updateEmploymentMutation.isPending,
    isDeleting: deleteEmploymentMutation.isPending,
  };
};
