import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SystemTemplate {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  requires_review: boolean;
  version: number;
  status: string;
  settings: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSystemTemplateData {
  title: string;
  description?: string;
  created_by: string;
  published?: boolean;
  requires_review?: boolean;
  settings?: Record<string, any>;
}

export interface UpdateSystemTemplateData {
  title?: string;
  description?: string;
  published?: boolean;
  requires_review?: boolean;
  settings?: Record<string, any>;
  status?: string;
}

// Fetch all system templates (for admin)
export const useSystemTemplates = () => {
  return useQuery({
    queryKey: ['system-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useSystemTemplates] Error fetching templates:', error);
        throw error;
      }

      return data as SystemTemplate[];
    },
  });
};

// Fetch published system templates (for tenants)
export const usePublishedSystemTemplates = () => {
  return useQuery({
    queryKey: ['system-templates-published'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_templates')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[usePublishedSystemTemplates] Error fetching templates:', error);
        throw error;
      }

      return data as SystemTemplate[];
    },
  });
};

// Fetch single system template
export const useSystemTemplate = (templateId: string | undefined) => {
  return useQuery({
    queryKey: ['system-template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      
      const { data, error } = await supabase
        .from('system_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        console.error('[useSystemTemplate] Error fetching template:', error);
        throw error;
      }

      return data as SystemTemplate;
    },
    enabled: !!templateId,
  });
};

// Create system template
export const useCreateSystemTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: CreateSystemTemplateData) => {
      const { data, error } = await supabase
        .from('system_templates')
        .insert([{
          ...templateData,
          settings: templateData.settings || {},
        }])
        .select()
        .single();

      if (error) {
        console.error('[useCreateSystemTemplate] Error creating template:', error);
        throw error;
      }

      return data as SystemTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-templates'] });
      toast({
        title: 'Template Created',
        description: 'System template has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create template',
        variant: 'destructive',
      });
    },
  });
};

// Update system template
export const useUpdateSystemTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, updates }: { templateId: string; updates: UpdateSystemTemplateData }) => {
      const { data, error } = await supabase
        .from('system_templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateSystemTemplate] Error updating template:', error);
        throw error;
      }

      return data as SystemTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-templates'] });
      queryClient.invalidateQueries({ queryKey: ['system-template', data.id] });
      queryClient.invalidateQueries({ queryKey: ['system-templates-published'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update template',
        variant: 'destructive',
      });
    },
  });
};

// Delete system template
export const useDeleteSystemTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('system_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        console.error('[useDeleteSystemTemplate] Error deleting template:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-templates'] });
      queryClient.invalidateQueries({ queryKey: ['system-templates-published'] });
      toast({
        title: 'Template Deleted',
        description: 'System template has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete template',
        variant: 'destructive',
      });
    },
  });
};

// Duplicate system template
export const useDuplicateSystemTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, userId }: { templateId: string; userId: string }) => {
      // Fetch original template
      const { data: original, error: fetchError } = await supabase
        .from('system_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      // Create duplicate
      const { data: newTemplate, error: createError } = await supabase
        .from('system_templates')
        .insert([{
          title: `${original.title} (Copy)`,
          description: original.description,
          published: false,
          requires_review: original.requires_review,
          settings: original.settings,
          created_by: userId,
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Fetch and duplicate elements
      const { data: elements, error: elementsError } = await supabase
        .from('system_template_elements')
        .select('*')
        .eq('template_id', templateId);

      if (elementsError) throw elementsError;

      if (elements && elements.length > 0) {
        const newElements = elements.map(el => ({
          template_id: newTemplate.id,
          element_type: el.element_type,
          label: el.label,
          required: el.required,
          order_index: el.order_index,
          properties: el.properties,
          validation_rules: el.validation_rules,
        }));

        const { error: insertError } = await supabase
          .from('system_template_elements')
          .insert(newElements);

        if (insertError) throw insertError;
      }

      return newTemplate as SystemTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-templates'] });
      toast({
        title: 'Template Duplicated',
        description: 'System template has been duplicated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to duplicate template',
        variant: 'destructive',
      });
    },
  });
};
