import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface SystemService {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  code: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface SystemHobby {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface SystemSkill {
  id: string;
  name: string;
  explanation: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface SystemMedicalCategory {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface SystemMedicalCondition {
  id: string;
  title: string;
  category_id: string | null;
  field_caption: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  category?: SystemMedicalCategory;
}

export interface SystemWorkType {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface SystemBodyMapPoint {
  id: string;
  letter: string;
  title: string;
  color: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// ============== SYSTEM SERVICES ==============
export const useSystemServices = () => {
  return useQuery({
    queryKey: ['system-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_services')
        .select('*')
        .order('title');
      if (error) throw error;
      return data as SystemService[];
    },
  });
};

export const useCreateSystemService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (service: Omit<SystemService, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('system_services')
        .insert(service)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-services'] });
      toast.success('Service created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create service: ' + error.message);
    },
  });
};

export const useUpdateSystemService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SystemService> & { id: string }) => {
      const { data, error } = await supabase
        .from('system_services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-services'] });
      toast.success('Service updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update service: ' + error.message);
    },
  });
};

export const useDeleteSystemService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('system_services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-services'] });
      toast.success('Service deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete service: ' + error.message);
    },
  });
};

// ============== SYSTEM HOBBIES ==============
export const useSystemHobbies = () => {
  return useQuery({
    queryKey: ['system-hobbies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_hobbies')
        .select('*')
        .order('title');
      if (error) throw error;
      return data as SystemHobby[];
    },
  });
};

export const useCreateSystemHobby = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (hobby: Omit<SystemHobby, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('system_hobbies')
        .insert(hobby)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-hobbies'] });
      toast.success('Hobby created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create hobby: ' + error.message);
    },
  });
};

export const useUpdateSystemHobby = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SystemHobby> & { id: string }) => {
      const { data, error } = await supabase
        .from('system_hobbies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-hobbies'] });
      toast.success('Hobby updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update hobby: ' + error.message);
    },
  });
};

export const useDeleteSystemHobby = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('system_hobbies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-hobbies'] });
      toast.success('Hobby deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete hobby: ' + error.message);
    },
  });
};

// ============== SYSTEM SKILLS ==============
export const useSystemSkills = () => {
  return useQuery({
    queryKey: ['system-skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_skills')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as SystemSkill[];
    },
  });
};

export const useCreateSystemSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (skill: Omit<SystemSkill, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('system_skills')
        .insert(skill)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-skills'] });
      toast.success('Skill created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create skill: ' + error.message);
    },
  });
};

export const useUpdateSystemSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SystemSkill> & { id: string }) => {
      const { data, error } = await supabase
        .from('system_skills')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-skills'] });
      toast.success('Skill updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update skill: ' + error.message);
    },
  });
};

export const useDeleteSystemSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('system_skills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-skills'] });
      toast.success('Skill deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete skill: ' + error.message);
    },
  });
};

// ============== SYSTEM MEDICAL CATEGORIES ==============
export const useSystemMedicalCategories = () => {
  return useQuery({
    queryKey: ['system-medical-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_medical_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as SystemMedicalCategory[];
    },
  });
};

export const useCreateSystemMedicalCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Omit<SystemMedicalCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('system_medical_categories')
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-medical-categories'] });
      toast.success('Medical category created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create medical category: ' + error.message);
    },
  });
};

export const useUpdateSystemMedicalCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SystemMedicalCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('system_medical_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-medical-categories'] });
      toast.success('Medical category updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update medical category: ' + error.message);
    },
  });
};

export const useDeleteSystemMedicalCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('system_medical_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-medical-categories'] });
      toast.success('Medical category deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete medical category: ' + error.message);
    },
  });
};

// ============== SYSTEM MEDICAL CONDITIONS ==============
export const useSystemMedicalConditions = () => {
  return useQuery({
    queryKey: ['system-medical-conditions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_medical_conditions')
        .select('*, category:system_medical_categories(*)')
        .order('title');
      if (error) throw error;
      return data as SystemMedicalCondition[];
    },
  });
};

export const useCreateSystemMedicalCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (condition: Omit<SystemMedicalCondition, 'id' | 'created_at' | 'updated_at' | 'category'>) => {
      const { data, error } = await supabase
        .from('system_medical_conditions')
        .insert(condition)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-medical-conditions'] });
      toast.success('Medical condition created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create medical condition: ' + error.message);
    },
  });
};

export const useUpdateSystemMedicalCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SystemMedicalCondition> & { id: string }) => {
      const { category, ...updateData } = updates;
      const { data, error } = await supabase
        .from('system_medical_conditions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-medical-conditions'] });
      toast.success('Medical condition updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update medical condition: ' + error.message);
    },
  });
};

export const useDeleteSystemMedicalCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('system_medical_conditions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-medical-conditions'] });
      toast.success('Medical condition deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete medical condition: ' + error.message);
    },
  });
};

// ============== SYSTEM WORK TYPES ==============
export const useSystemWorkTypes = () => {
  return useQuery({
    queryKey: ['system-work-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_work_types')
        .select('*')
        .order('title');
      if (error) throw error;
      return data as SystemWorkType[];
    },
  });
};

export const useCreateSystemWorkType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workType: Omit<SystemWorkType, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('system_work_types')
        .insert(workType)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-work-types'] });
      toast.success('Work type created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create work type: ' + error.message);
    },
  });
};

export const useUpdateSystemWorkType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SystemWorkType> & { id: string }) => {
      const { data, error } = await supabase
        .from('system_work_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-work-types'] });
      toast.success('Work type updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update work type: ' + error.message);
    },
  });
};

export const useDeleteSystemWorkType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('system_work_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-work-types'] });
      toast.success('Work type deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete work type: ' + error.message);
    },
  });
};

// ============== SYSTEM BODY MAP POINTS ==============
export const useSystemBodyMapPoints = () => {
  return useQuery({
    queryKey: ['system-body-map-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_body_map_points')
        .select('*')
        .order('letter');
      if (error) throw error;
      return data as SystemBodyMapPoint[];
    },
  });
};

export const useCreateSystemBodyMapPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (point: Omit<SystemBodyMapPoint, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('system_body_map_points')
        .insert(point)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-body-map-points'] });
      toast.success('Body map point created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create body map point: ' + error.message);
    },
  });
};

export const useUpdateSystemBodyMapPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SystemBodyMapPoint> & { id: string }) => {
      const { data, error } = await supabase
        .from('system_body_map_points')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-body-map-points'] });
      toast.success('Body map point updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update body map point: ' + error.message);
    },
  });
};

export const useDeleteSystemBodyMapPoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('system_body_map_points').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-body-map-points'] });
      toast.success('Body map point deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete body map point: ' + error.message);
    },
  });
};
