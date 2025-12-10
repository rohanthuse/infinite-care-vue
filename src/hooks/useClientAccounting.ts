import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClientAccountingSettings, ClientPrivateAccounting, ServiceType, ClientRateSchedule } from '@/types/clientAccounting';

// Client Accounting Settings Hooks
export const useClientAccountingSettings = (clientId: string) => {
  return useQuery({
    queryKey: ['client-accounting-settings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_accounting_settings')
        .select('*')
        .eq('client_id', clientId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data as ClientAccountingSettings | null;
    },
    enabled: !!clientId
  });
};

export const useCreateOrUpdateClientAccountingSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (settings: Omit<ClientAccountingSettings, 'id' | 'created_at' | 'updated_at'>) => {
      // Defensive sanitization: convert empty strings to null for UUID fields
      const sanitizedSettings = {
        ...settings,
        branch_id: settings.branch_id || null,
        organization_id: settings.organization_id || null,
        care_lead_id: settings.care_lead_id || null,
      };
      
      const { data: existing } = await supabase
        .from('client_accounting_settings')
        .select('id')
        .eq('client_id', sanitizedSettings.client_id!)
        .maybeSingle();
      
      if (existing) {
        const { data, error } = await supabase
          .from('client_accounting_settings')
          .update(sanitizedSettings)
          .eq('client_id', sanitizedSettings.client_id!)
          .select('*')
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('client_accounting_settings')
          .insert([sanitizedSettings])
          .select('*')
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-accounting-settings'] });
      toast({
        title: "Settings Updated",
        description: "Client accounting settings have been saved successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};

// Client Private Accounting Hooks
export const useClientPrivateAccounting = (clientId: string) => {
  return useQuery({
    queryKey: ['client-private-accounting', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_private_accounting')
        .select('*')
        .eq('client_id', clientId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data as ClientPrivateAccounting | null;
    },
    enabled: !!clientId
  });
};

export const useCreateOrUpdateClientPrivateAccounting = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (settings: Omit<ClientPrivateAccounting, 'id' | 'created_at' | 'updated_at'>) => {
      // Defensive sanitization: convert empty strings to null for UUID fields
      const sanitizedSettings = {
        ...settings,
        branch_id: settings.branch_id || null,
        organization_id: settings.organization_id || null,
        travel_rate_id: settings.travel_rate_id || null,
      };
      
      const { data: existing } = await supabase
        .from('client_private_accounting')
        .select('id')
        .eq('client_id', sanitizedSettings.client_id!)
        .maybeSingle();
      
      if (existing) {
        const { data, error } = await supabase
          .from('client_private_accounting')
          .update(sanitizedSettings)
          .eq('client_id', sanitizedSettings.client_id!)
          .select('*')
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('client_private_accounting')
          .insert([sanitizedSettings])
          .select('*')
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-private-accounting'] });
      toast({
        title: "Settings Updated",
        description: "Private accounting settings have been saved successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};

// Service Types Hooks
export const useServiceTypes = () => {
  return useQuery({
    queryKey: ['service-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as ServiceType[];
    }
  });
};

// Client Rate Schedules Hooks
export const useClientRateSchedules = (clientId: string) => {
  return useQuery({
    queryKey: ['client-rate-schedules', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_rate_schedules')
        .select('*')
        .eq('client_id', clientId)
        .order('is_active', { ascending: false })
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as ClientRateSchedule[];
    },
    enabled: !!clientId
  });
};

export const useCreateClientRateSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (schedule: Omit<ClientRateSchedule, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('client_rate_schedules')
        .insert([schedule])
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['client-rate-schedules'],
        exact: false
      });
      toast({
        title: "Rate Schedule Created",
        description: "New rate schedule has been created successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};

export const useUpdateClientRateSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClientRateSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from('client_rate_schedules')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['client-rate-schedules'],
        exact: false
      });
      toast({
        title: "Rate Schedule Updated",
        description: "Rate schedule has been updated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};

export const useDeleteClientRateSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('client_rate_schedules')
        .update({ is_active: false })
        .eq('id', scheduleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['client-rate-schedules'],
        exact: false
      });
      toast({
        title: "Rate Schedule Deleted",
        description: "Rate schedule has been deactivated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};