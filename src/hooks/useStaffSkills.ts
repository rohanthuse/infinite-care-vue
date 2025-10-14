import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StaffSkill {
  id: string;
  staff_id: string;
  skill_id: string;
  proficiency_level: 'beginner' | 'basic' | 'intermediate' | 'advanced' | 'expert';
  verified: boolean;
  last_assessed: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  skills?: {
    id: string;
    name: string;
    explanation: string | null;
    status: string;
  };
}

export const useStaffSkills = (staffId: string) => {
  return useQuery({
    queryKey: ['staff-skills', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_skills')
        .select(`
          *,
          skills (
            id,
            name,
            explanation,
            status
          )
        `)
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StaffSkill[];
    },
    enabled: !!staffId
  });
};

export const useAddStaffSkill = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (skillData: {
      staff_id: string;
      skill_id: string;
      proficiency_level: string;
      verified?: boolean;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('staff_skills')
        .insert([skillData])
        .select(`
          *,
          skills (
            id,
            name,
            explanation,
            status
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-skills'] });
      toast({
        title: 'Skill added',
        description: `${data.skills?.name} has been added successfully.`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error adding skill',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useUpdateStaffSkill = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: Partial<StaffSkill>;
    }) => {
      const { data, error } = await supabase
        .from('staff_skills')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          skills (
            id,
            name,
            explanation,
            status
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-skills'] });
      toast({
        title: 'Skill updated',
        description: 'Skill has been updated successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating skill',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useDeleteStaffSkill = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_skills')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-skills'] });
      toast({
        title: 'Skill removed',
        description: 'Skill has been removed successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error removing skill',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useAvailableSkills = () => {
  return useQuery({
    queryKey: ['available-skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('status', 'Active')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    }
  });
};
