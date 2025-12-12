import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";

export interface Diagnosis {
  id: string;
  title: string;
  category_id?: string;
  field_caption?: string;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
  organization_id?: string;
}

export interface DiagnosisInsert {
  title: string;
  status?: "Active" | "Inactive";
  field_caption?: string;
}

export function useDiagnosis() {
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['diagnosis', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.log('No organization ID available');
        return [];
      }
      
      console.log('Fetching diagnosis for organization:', organization.id);
      const { data, error } = await supabase
        .from('medical_conditions')
        .select('*')
        .eq('organization_id', organization.id)
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching diagnosis:', error);
        throw error;
      }
      
      console.log('Fetched diagnosis:', data);
      return data as Diagnosis[];
    },
    enabled: !!organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: DiagnosisInsert) => {
      if (!organization?.id) {
        throw new Error('No organization selected');
      }
      
      const itemWithOrg = { 
        ...newItem, 
        organization_id: organization.id,
        category_id: null // Optional field, can be null
      };
      console.log('Creating diagnosis:', itemWithOrg);
      const { data, error } = await supabase
        .from('medical_conditions')
        .insert([itemWithOrg as any])
        .select()
        .single();

      if (error) {
        console.error('Error creating diagnosis:', error);
        throw error;
      }
      
      console.log('Created diagnosis:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnosis', organization?.id] });
      toast({
        title: "Success",
        description: "Diagnosis created successfully",
      });
    },
    onError: (error) => {
      console.error('Diagnosis creation failed:', error);
      toast({
        title: "Error",
        description: `Failed to create diagnosis: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Diagnosis> }) => {
      console.log('Updating diagnosis:', { id, updates });
      const { data, error } = await supabase
        .from('medical_conditions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating diagnosis:', error);
        throw error;
      }
      
      console.log('Updated diagnosis:', data);
      return data;
    },
    onSuccess: () => {
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');

      toast({
        title: "Success",
        description: "Diagnosis updated successfully",
      });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['diagnosis', organization?.id] });
      }, 300);
    },
    onError: (error) => {
      console.error('Diagnosis update failed:', error);
      
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      toast({
        title: "Error",
        description: `Failed to update diagnosis: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting diagnosis:', id);
      const { error } = await supabase
        .from('medical_conditions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting diagnosis:', error);
        throw error;
      }
      
      console.log('Deleted diagnosis:', id);
    },
    onSuccess: () => {
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');

      toast({
        title: "Success",
        description: "Diagnosis deleted successfully",
      });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['diagnosis', organization?.id] });
      }, 300);
    },
    onError: (error) => {
      console.error('Diagnosis deletion failed:', error);
      
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      toast({
        title: "Error",
        description: `Failed to delete diagnosis: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    data,
    isLoading,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
