
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Completely isolated interfaces matching actual database schema
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
  title?: string;
  middle_name?: string;
  telephone_number?: string;
  mobile_number?: string;
  country_code?: string;
  region?: string;
  referral_route?: string;
  pronouns?: string;
  other_identifier?: string;
  additional_information?: string;
  avatar_initials?: string;
  registered_on?: string;
  created_at?: string;
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

// Simple fetcher functions with basic return types
const fetchClientProfile = async (clientId: string) => {
  const response = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (response.error) throw response.error;
  return response.data;
};

const fetchClientCarePlans = async (clientId: string) => {
  const response = await supabase
    .from('client_care_plans')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (response.error) throw response.error;
  return response.data || [];
};

const fetchCarePlanGoals = async (carePlanId: string) => {
  const response = await supabase
    .from('client_care_plan_goals')
    .select('*')
    .eq('care_plan_id', carePlanId)
    .order('created_at', { ascending: false });

  if (response.error) throw response.error;
  return response.data || [];
};

const fetchClientAppointments = async (clientId: string) => {
  const response = await supabase
    .from('client_appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: true });

  if (response.error) throw response.error;
  return response.data || [];
};

// Basic hooks with explicit query configuration
export const useClientProfile = (clientId: string) => {
  const config = {
    queryKey: ['client-profile', clientId] as const,
    queryFn: () => fetchClientProfile(clientId),
    enabled: Boolean(clientId),
  };
  
  return useQuery(config);
};

export const useClientCarePlans = (clientId: string) => {
  const config = {
    queryKey: ['client-care-plans', clientId] as const,
    queryFn: () => fetchClientCarePlans(clientId),
    enabled: Boolean(clientId),
  };
  
  return useQuery(config);
};

export const useCarePlanGoals = (carePlanId: string) => {
  const config = {
    queryKey: ['care-plan-goals', carePlanId] as const,
    queryFn: () => fetchCarePlanGoals(carePlanId),
    enabled: Boolean(carePlanId),
  };
  
  return useQuery(config);
};

export const useClientAppointments = (clientId: string) => {
  const config = {
    queryKey: ['client-appointments', clientId] as const,
    queryFn: () => fetchClientAppointments(clientId),
    enabled: Boolean(clientId),
  };
  
  return useQuery(config);
};

// Mutation hooks with simplified configuration
export const useUpdateClientProfile = () => {
  const queryClient = useQueryClient();

  const config = {
    mutationFn: async (params: { clientId: string; updates: Partial<ClientProfile> }) => {
      const response = await supabase
        .from('clients')
        .update(params.updates)
        .eq('id', params.clientId)
        .select()
        .single();

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['client-profile', data.id] });
    },
  };

  return useMutation(config);
};

export const useUpdateCarePlanGoal = () => {
  const queryClient = useQueryClient();

  const config = {
    mutationFn: async (params: { goalId: string; updates: Partial<ClientCarePlanGoal> }) => {
      const response = await supabase
        .from('client_care_plan_goals')
        .update(params.updates)
        .eq('id', params.goalId)
        .select()
        .single();

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['care-plan-goals', data.care_plan_id] });
    },
  };

  return useMutation(config);
};

export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();

  const config = {
    mutationFn: async (params: { appointmentId: string; newDate: string; newTime: string }) => {
      const response = await supabase
        .from('client_appointments')
        .update({
          appointment_date: params.newDate,
          appointment_time: params.newTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.appointmentId)
        .select()
        .single();

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['client-appointments', data.client_id] });
    },
  };

  return useMutation(config);
};
