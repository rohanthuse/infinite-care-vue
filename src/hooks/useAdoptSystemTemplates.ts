import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

// Types for system templates - matching actual database schema
export interface SystemService {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  status: string;
}

export interface SystemHobby {
  id: string;
  title: string;
  status: string;
}

export interface SystemSkill {
  id: string;
  name: string;
  explanation: string | null;
  status: string;
}

export interface SystemWorkType {
  id: string;
  title: string;
  status: string;
}

export interface SystemBodyMapPoint {
  id: string;
  letter: string;
  title: string;
  color: string;
  status: string;
}

export interface SystemMedicalCategory {
  id: string;
  name: string;
  status: string;
}

export interface SystemMedicalCondition {
  id: string;
  title: string;
  category_id: string | null;
  field_caption: string | null;
  status: string;
}

// Hook to fetch available system templates for adoption
export const useAvailableSystemServices = () => {
  return useQuery({
    queryKey: ['system_services_available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_services')
        .select('*')
        .eq('status', 'active')
        .order('title');
      if (error) throw error;
      return data as SystemService[];
    },
  });
};

export const useAvailableSystemHobbies = () => {
  return useQuery({
    queryKey: ['system_hobbies_available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_hobbies')
        .select('id, title, status')
        .eq('status', 'active')
        .order('title');
      if (error) throw error;
      return data as unknown as SystemHobby[];
    },
  });
};

export const useAvailableSystemSkills = () => {
  return useQuery({
    queryKey: ['system_skills_available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_skills')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data as SystemSkill[];
    },
  });
};

export const useAvailableSystemWorkTypes = () => {
  return useQuery({
    queryKey: ['system_work_types_available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_work_types')
        .select('id, title, status')
        .eq('status', 'active')
        .order('title');
      if (error) throw error;
      return data as unknown as SystemWorkType[];
    },
  });
};

export const useAvailableSystemBodyMapPoints = () => {
  return useQuery({
    queryKey: ['system_body_map_points_available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_body_map_points')
        .select('*')
        .eq('status', 'active')
        .order('letter');
      if (error) throw error;
      return data as SystemBodyMapPoint[];
    },
  });
};

export const useAvailableSystemMedicalCategories = () => {
  return useQuery({
    queryKey: ['system_medical_categories_available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_medical_categories')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data as unknown as SystemMedicalCategory[];
    },
  });
};

export const useAvailableSystemMedicalConditions = () => {
  return useQuery({
    queryKey: ['system_medical_conditions_available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_medical_conditions')
        .select('id, title, category_id, field_caption, status')
        .eq('status', 'active')
        .order('title');
      if (error) throw error;
      return data as unknown as SystemMedicalCondition[];
    },
  });
};

// Hook to check which system templates are already adopted
export const useAdoptedTemplates = (type: 'services' | 'hobbies' | 'skills' | 'work_types' | 'body_map_points') => {
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['adopted_templates', type, organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      // Use type assertion to handle TypeScript sync issues with source_system_id column
      const { data, error } = await supabase
        .from(type)
        .select('source_system_id')
        .eq('organization_id', organization.id)
        .not('source_system_id', 'is', null) as unknown as { data: { source_system_id: string }[] | null; error: Error | null };
      
      if (error) throw error;
      return (data || []).map(item => item.source_system_id).filter(Boolean);
    },
    enabled: !!organization?.id,
  });
};

// Separate hook for medical tables that may have different column names
export const useAdoptedMedicalCategories = () => {
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['adopted_templates', 'medical_categories', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      // Using raw query to avoid TypeScript sync issues with new columns
      const { data, error } = await supabase
        .from('medical_categories')
        .select('source_system_id')
        .eq('organization_id', organization.id)
        .not('source_system_id', 'is', null) as unknown as { data: { source_system_id: string }[] | null; error: Error | null };
      
      if (error) throw error;
      return (data || []).map(item => item.source_system_id).filter(Boolean);
    },
    enabled: !!organization?.id,
  });
};

export const useAdoptedMedicalConditions = () => {
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['adopted_templates', 'medical_conditions', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      // Using raw query to avoid TypeScript sync issues with new columns
      const { data, error } = await supabase
        .from('medical_conditions')
        .select('source_system_id')
        .eq('organization_id', organization.id)
        .not('source_system_id', 'is', null) as unknown as { data: { source_system_id: string }[] | null; error: Error | null };
      
      if (error) throw error;
      return (data || []).map(item => item.source_system_id).filter(Boolean);
    },
    enabled: !!organization?.id,
  });
};

// Adoption mutation hooks
export const useAdoptSystemServices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();
  
  return useMutation({
    mutationFn: async (systemServices: SystemService[]) => {
      if (!organization?.id) throw new Error('No organization selected');
      
      const inserts = systemServices.map(service => ({
        title: service.title,
        category: service.category,
        description: service.description,
        status: 'active',
        organization_id: organization.id,
        source_system_id: service.id,
      }));
      
      const { error } = await supabase.from('services').insert(inserts);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: `${variables.length} service(s) adopted successfully` });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['adopted_templates', 'services'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to adopt services', description: error.message, variant: 'destructive' });
    },
  });
};

export const useAdoptSystemHobbies = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();
  
  return useMutation({
    mutationFn: async (systemHobbies: SystemHobby[]) => {
      if (!organization?.id) throw new Error('No organization selected');
      
      const inserts = systemHobbies.map(hobby => ({
        title: hobby.title,
        status: 'active',
        organization_id: organization.id,
        source_system_id: hobby.id,
      }));
      
      const { error } = await supabase.from('hobbies').insert(inserts);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: `${variables.length} hobby(ies) adopted successfully` });
      queryClient.invalidateQueries({ queryKey: ['hobbies'] });
      queryClient.invalidateQueries({ queryKey: ['adopted_templates', 'hobbies'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to adopt hobbies', description: error.message, variant: 'destructive' });
    },
  });
};

export const useAdoptSystemSkills = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();
  
  return useMutation({
    mutationFn: async (systemSkills: SystemSkill[]) => {
      if (!organization?.id) throw new Error('No organization selected');
      
      const inserts = systemSkills.map(skill => ({
        name: skill.name,
        explanation: skill.explanation,
        status: 'active',
        organization_id: organization.id,
        source_system_id: skill.id,
      }));
      
      const { error } = await supabase.from('skills').insert(inserts);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: `${variables.length} skill(s) adopted successfully` });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['adopted_templates', 'skills'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to adopt skills', description: error.message, variant: 'destructive' });
    },
  });
};

export const useAdoptSystemWorkTypes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();
  
  return useMutation({
    mutationFn: async (systemWorkTypes: SystemWorkType[]) => {
      if (!organization?.id) throw new Error('No organization selected');
      
      const inserts = systemWorkTypes.map(workType => ({
        title: workType.title,
        status: 'active',
        organization_id: organization.id,
        source_system_id: workType.id,
      }));
      
      const { error } = await supabase.from('work_types').insert(inserts);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: `${variables.length} work type(s) adopted successfully` });
      queryClient.invalidateQueries({ queryKey: ['work_types'] });
      queryClient.invalidateQueries({ queryKey: ['adopted_templates', 'work_types'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to adopt work types', description: error.message, variant: 'destructive' });
    },
  });
};

export const useAdoptSystemBodyMapPoints = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();
  
  return useMutation({
    mutationFn: async (systemPoints: SystemBodyMapPoint[]) => {
      if (!organization?.id) throw new Error('No organization selected');
      
      const inserts = systemPoints.map(point => ({
        letter: point.letter,
        title: point.title,
        color: point.color,
        status: 'active',
        organization_id: organization.id,
        source_system_id: point.id,
      }));
      
      const { error } = await supabase.from('body_map_points').insert(inserts);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: `${variables.length} body map point(s) adopted successfully` });
      queryClient.invalidateQueries({ queryKey: ['body_map_points'] });
      queryClient.invalidateQueries({ queryKey: ['adopted_templates', 'body_map_points'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to adopt body map points', description: error.message, variant: 'destructive' });
    },
  });
};

export const useAdoptSystemMedicalCategories = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();
  
  return useMutation({
    mutationFn: async (systemCategories: SystemMedicalCategory[]) => {
      if (!organization?.id) throw new Error('No organization selected');
      
      const inserts = systemCategories.map(category => ({
        name: category.name,
        status: 'active',
        organization_id: organization.id,
        source_system_id: category.id,
      }));
      
      // Use type assertion for insert since types may not be synced yet
      const { error } = await (supabase.from('medical_categories') as unknown as { insert: (data: typeof inserts) => Promise<{ error: Error | null }> }).insert(inserts);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: `${variables.length} medical category(ies) adopted successfully` });
      queryClient.invalidateQueries({ queryKey: ['medical_categories'] });
      queryClient.invalidateQueries({ queryKey: ['adopted_templates', 'medical_categories'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to adopt medical categories', description: error.message, variant: 'destructive' });
    },
  });
};

export const useAdoptSystemMedicalConditions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();
  
  return useMutation({
    mutationFn: async (systemConditions: SystemMedicalCondition[]) => {
      if (!organization?.id) throw new Error('No organization selected');
      
      const inserts = systemConditions.map(condition => ({
        title: condition.title,
        field_caption: condition.field_caption,
        status: 'active',
        organization_id: organization.id,
        source_system_id: condition.id,
      }));
      
      // Use type assertion for insert since types may not be synced yet
      const { error } = await (supabase.from('medical_conditions') as unknown as { insert: (data: typeof inserts) => Promise<{ error: Error | null }> }).insert(inserts);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: `${variables.length} medical condition(s) adopted successfully` });
      queryClient.invalidateQueries({ queryKey: ['medical_conditions'] });
      queryClient.invalidateQueries({ queryKey: ['adopted_templates', 'medical_conditions'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to adopt medical conditions', description: error.message, variant: 'destructive' });
    },
  });
};
