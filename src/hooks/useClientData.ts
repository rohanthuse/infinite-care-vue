
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

// Type-safe data transformers to break inference chains
const transformToClientProfile = (data: any): ClientProfile => {
  return {
    id: data.id,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    date_of_birth: data.date_of_birth,
    address: data.address,
    gender: data.gender,
    preferred_name: data.preferred_name,
    status: data.status,
    branch_id: data.branch_id,
    user_id: data.user_id,
  };
};

const transformToCarePlan = (data: any): ClientCarePlan => {
  return {
    id: data.id,
    client_id: data.client_id,
    title: data.title,
    provider_name: data.provider_name,
    start_date: data.start_date,
    end_date: data.end_date,
    review_date: data.review_date,
    status: data.status,
    goals_progress: data.goals_progress,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

const transformToCarePlanGoal = (data: any): ClientCarePlanGoal => {
  return {
    id: data.id,
    care_plan_id: data.care_plan_id,
    description: data.description,
    status: data.status,
    progress: data.progress,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

const transformToAppointment = (data: any): ClientAppointment => {
  return {
    id: data.id,
    client_id: data.client_id,
    appointment_type: data.appointment_type,
    appointment_date: data.appointment_date,
    appointment_time: data.appointment_time,
    provider_name: data.provider_name,
    location: data.location,
    status: data.status,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

// Hook to get current client profile - completely independent
export const useClientProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');
      
      const response = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (response.error) throw response.error;
      
      // Use explicit transformation to break type inference chain
      const transformedData = transformToClientProfile(response.data);
      return transformedData;
    },
    enabled: !!user?.id,
  });
};

// Hook to get client care plans - completely independent, requires clientId
export const useClientCarePlans = (clientId: string) => {
  return useQuery({
    queryKey: ['client-care-plans', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('No client ID provided');

      const response = await supabase
        .from('client_care_plans')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (response.error) throw response.error;
      
      const transformedData = (response.data || []).map(transformToCarePlan);
      return transformedData;
    },
    enabled: !!clientId,
  });
};

// Hook to get care plan goals - completely independent
export const useCarePlanGoals = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan-goals', carePlanId],
    queryFn: async () => {
      const response = await supabase
        .from('client_care_plan_goals')
        .select('*')
        .eq('care_plan_id', carePlanId)
        .order('created_at', { ascending: false });

      if (response.error) throw response.error;
      
      const transformedData = (response.data || []).map(transformToCarePlanGoal);
      return transformedData;
    },
    enabled: !!carePlanId,
  });
};

// Hook to get client appointments - completely independent, requires clientId
export const useClientAppointments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-appointments', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('No client ID provided');

      const response = await supabase
        .from('client_appointments')
        .select('*')
        .eq('client_id', clientId)
        .order('appointment_date', { ascending: true });

      if (response.error) throw response.error;
      
      const transformedData = (response.data || []).map(transformToAppointment);
      return transformedData;
    },
    enabled: !!clientId,
  });
};

// Hook to update client profile
export const useUpdateClientProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<ClientProfile>) => {
      if (!user?.id) throw new Error('No authenticated user');

      const response = await supabase
        .from('clients')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (response.error) throw response.error;
      
      const transformedData = transformToClientProfile(response.data);
      return transformedData;
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
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: Partial<ClientCarePlanGoal> }) => {
      const response = await supabase
        .from('client_care_plan_goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (response.error) throw response.error;
      
      const transformedData = transformToCarePlanGoal(response.data);
      return transformedData;
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
    mutationFn: async ({ appointmentId, newDate, newTime }: { appointmentId: string; newDate: string; newTime: string }) => {
      const response = await supabase
        .from('client_appointments')
        .update({
          appointment_date: newDate,
          appointment_time: newTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (response.error) throw response.error;
      
      const transformedData = transformToAppointment(response.data);
      return transformedData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-appointments', data.client_id] });
    },
  });
};
