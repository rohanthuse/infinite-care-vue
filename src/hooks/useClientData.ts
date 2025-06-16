
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

// Simple data fetching functions that return unknown and cast explicitly
const fetchClientProfile = async (userId: string): Promise<ClientProfile> => {
  const response = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (response.error) throw response.error;
  
  const rawData = response.data as any;
  return {
    id: rawData.id,
    first_name: rawData.first_name,
    last_name: rawData.last_name,
    email: rawData.email,
    phone: rawData.phone,
    date_of_birth: rawData.date_of_birth,
    address: rawData.address,
    gender: rawData.gender,
    preferred_name: rawData.preferred_name,
    status: rawData.status,
    branch_id: rawData.branch_id,
    user_id: rawData.user_id,
  };
};

const fetchClientCarePlans = async (clientId: string): Promise<ClientCarePlan[]> => {
  const response = await supabase
    .from('client_care_plans')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (response.error) throw response.error;
  
  const rawData = response.data as any[];
  return rawData.map(item => ({
    id: item.id,
    client_id: item.client_id,
    title: item.title,
    provider_name: item.provider_name,
    start_date: item.start_date,
    end_date: item.end_date,
    review_date: item.review_date,
    status: item.status,
    goals_progress: item.goals_progress,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
};

const fetchCarePlanGoals = async (carePlanId: string): Promise<ClientCarePlanGoal[]> => {
  const response = await supabase
    .from('client_care_plan_goals')
    .select('*')
    .eq('care_plan_id', carePlanId)
    .order('created_at', { ascending: false });

  if (response.error) throw response.error;
  
  const rawData = response.data as any[];
  return rawData.map(item => ({
    id: item.id,
    care_plan_id: item.care_plan_id,
    description: item.description,
    status: item.status,
    progress: item.progress,
    notes: item.notes,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
};

const fetchClientAppointments = async (clientId: string): Promise<ClientAppointment[]> => {
  const response = await supabase
    .from('client_appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: true });

  if (response.error) throw response.error;
  
  const rawData = response.data as any[];
  return rawData.map(item => ({
    id: item.id,
    client_id: item.client_id,
    appointment_type: item.appointment_type,
    appointment_date: item.appointment_date,
    appointment_time: item.appointment_time,
    provider_name: item.provider_name,
    location: item.location,
    status: item.status,
    notes: item.notes,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
};

// Hook implementations using the separate functions
export const useClientProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('No authenticated user');
      return fetchClientProfile(user.id);
    },
    enabled: !!user?.id,
  });
};

export const useClientCarePlans = (clientId: string) => {
  return useQuery({
    queryKey: ['client-care-plans', clientId],
    queryFn: () => {
      if (!clientId) throw new Error('No client ID provided');
      return fetchClientCarePlans(clientId);
    },
    enabled: !!clientId,
  });
};

export const useCarePlanGoals = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan-goals', carePlanId],
    queryFn: () => fetchCarePlanGoals(carePlanId),
    enabled: !!carePlanId,
  });
};

export const useClientAppointments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-appointments', clientId],
    queryFn: () => {
      if (!clientId) throw new Error('No client ID provided');
      return fetchClientAppointments(clientId);
    },
    enabled: !!clientId,
  });
};

// Mutation hooks
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
      
      const rawData = response.data as any;
      return {
        id: rawData.id,
        first_name: rawData.first_name,
        last_name: rawData.last_name,
        email: rawData.email,
        phone: rawData.phone,
        date_of_birth: rawData.date_of_birth,
        address: rawData.address,
        gender: rawData.gender,
        preferred_name: rawData.preferred_name,
        status: rawData.status,
        branch_id: rawData.branch_id,
        user_id: rawData.user_id,
      } as ClientProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
    },
  });
};

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
      
      const rawData = response.data as any;
      return {
        id: rawData.id,
        care_plan_id: rawData.care_plan_id,
        description: rawData.description,
        status: rawData.status,
        progress: rawData.progress,
        notes: rawData.notes,
        created_at: rawData.created_at,
        updated_at: rawData.updated_at,
      } as ClientCarePlanGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['care-plan-goals', data.care_plan_id] });
    },
  });
};

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
      
      const rawData = response.data as any;
      return {
        id: rawData.id,
        client_id: rawData.client_id,
        appointment_type: rawData.appointment_type,
        appointment_date: rawData.appointment_date,
        appointment_time: rawData.appointment_time,
        provider_name: rawData.provider_name,
        location: rawData.location,
        status: rawData.status,
        notes: rawData.notes,
        created_at: rawData.created_at,
        updated_at: rawData.updated_at,
      } as ClientAppointment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-appointments', data.client_id] });
    },
  });
};
