
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ClientProfile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  gender?: string;
  preferred_name?: string;
  status?: string;
  branch_id?: string;
  user_id?: string;
}

export interface ClientCarePlan {
  id: string;
  client_id: string;
  title: string;
  provider_name: string;
  start_date: string;
  end_date?: string;
  review_date?: string;
  status: string;
  goals_progress?: number;
  created_at: string;
  updated_at: string;
}

export interface ClientCarePlanGoal {
  id: string;
  care_plan_id: string;
  description: string;
  status: string;
  progress?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientAppointment {
  id: string;
  client_id: string;
  appointment_type: string;
  appointment_date: string;
  appointment_time: string;
  provider_name: string;
  location: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Hook to get current client profile
export const useClientProfile = () => {
  const { user } = useAuth();
  
  return useQuery<ClientProfile>({
    queryKey: ['client-profile', user?.id],
    queryFn: async (): Promise<ClientProfile> => {
      if (!user?.id) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as ClientProfile;
    },
    enabled: !!user?.id,
  });
};

// Hook to get client care plans - explicitly typed to prevent type depth issues
export const useClientCarePlans = (clientId?: string) => {
  const { user } = useAuth();
  const { data: clientProfile } = useClientProfile();

  return useQuery<ClientCarePlan[]>({
    queryKey: ['client-care-plans', clientId || clientProfile?.id],
    queryFn: async (): Promise<ClientCarePlan[]> => {
      const targetClientId = clientId || clientProfile?.id;
      if (!targetClientId) throw new Error('No client ID available');

      const { data, error } = await supabase
        .from('client_care_plans')
        .select('*')
        .eq('client_id', targetClientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClientCarePlan[];
    },
    enabled: !!(clientId || clientProfile?.id),
  });
};

// Hook to get care plan goals
export const useCarePlanGoals = (carePlanId: string) => {
  return useQuery<ClientCarePlanGoal[]>({
    queryKey: ['care-plan-goals', carePlanId],
    queryFn: async (): Promise<ClientCarePlanGoal[]> => {
      const { data, error } = await supabase
        .from('client_care_plan_goals')
        .select('*')
        .eq('care_plan_id', carePlanId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClientCarePlanGoal[];
    },
    enabled: !!carePlanId,
  });
};

// Hook to get client appointments - explicitly typed to prevent type depth issues
export const useClientAppointments = (clientId?: string) => {
  const { user } = useAuth();
  const { data: clientProfile } = useClientProfile();

  return useQuery<ClientAppointment[]>({
    queryKey: ['client-appointments', clientId || clientProfile?.id],
    queryFn: async (): Promise<ClientAppointment[]> => {
      const targetClientId = clientId || clientProfile?.id;
      if (!targetClientId) throw new Error('No client ID available');

      const { data, error } = await supabase
        .from('client_appointments')
        .select('*')
        .eq('client_id', targetClientId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data as ClientAppointment[];
    },
    enabled: !!(clientId || clientProfile?.id),
  });
};

// Hook to update client profile
export const useUpdateClientProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<ClientProfile>): Promise<ClientProfile> => {
      if (!user?.id) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as ClientProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
    },
  });
};

// Hook to create/update care plan goal
export const useUpdateCarePlanGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: Partial<ClientCarePlanGoal> }): Promise<ClientCarePlanGoal> => {
      const { data, error } = await supabase
        .from('client_care_plan_goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      return data as ClientCarePlanGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['care-plan-goals', data.care_plan_id] });
    },
  });
};

// Hook to reschedule appointment
export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      appointmentId, 
      newDate, 
      newTime 
    }: { 
      appointmentId: string; 
      newDate: string; 
      newTime: string; 
    }): Promise<ClientAppointment> => {
      const { data, error } = await supabase
        .from('client_appointments')
        .update({
          appointment_date: newDate,
          appointment_time: newTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;
      return data as ClientAppointment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-appointments', data.client_id] });
    },
  });
};
