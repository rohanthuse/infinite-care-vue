
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Completely isolated interfaces - no complex generics
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

// Type-safe data fetchers with explicit return types
async function fetchClientProfile(userId: string): Promise<ClientProfile> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  
  // Manual construction to avoid type inference
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
}

async function fetchClientCarePlans(clientId: string): Promise<ClientCarePlan[]> {
  const { data, error } = await supabase
    .from('client_care_plans')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data as any[]).map((item: any): ClientCarePlan => ({
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
}

async function fetchCarePlanGoals(carePlanId: string): Promise<ClientCarePlanGoal[]> {
  const { data, error } = await supabase
    .from('client_care_plan_goals')
    .select('*')
    .eq('care_plan_id', carePlanId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data as any[]).map((item: any): ClientCarePlanGoal => ({
    id: item.id,
    care_plan_id: item.care_plan_id,
    description: item.description,
    status: item.status,
    progress: item.progress,
    notes: item.notes,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}

async function fetchClientAppointments(clientId: string): Promise<ClientAppointment[]> {
  const { data, error } = await supabase
    .from('client_appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: true });

  if (error) throw error;
  
  return (data as any[]).map((item: any): ClientAppointment => ({
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
}

// Hooks with minimal type inference
export const useClientProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');
      return await fetchClientProfile(user.id);
    },
    enabled: !!user?.id,
  });
};

export const useClientCarePlans = (clientId: string) => {
  return useQuery({
    queryKey: ['client-care-plans', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('No client ID provided');
      return await fetchClientCarePlans(clientId);
    },
    enabled: !!clientId,
  });
};

export const useCarePlanGoals = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan-goals', carePlanId],
    queryFn: async () => await fetchCarePlanGoals(carePlanId),
    enabled: !!carePlanId,
  });
};

export const useClientAppointments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-appointments', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('No client ID provided');
      return await fetchClientAppointments(clientId);
    },
    enabled: !!clientId,
  });
};

// Mutation hooks with explicit typing
export const useUpdateClientProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<ClientProfile>) => {
      if (!user?.id) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
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
      const { data, error } = await supabase
        .from('client_care_plan_goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        care_plan_id: data.care_plan_id,
        description: data.description,
        status: data.status,
        progress: data.progress,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
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
      } as ClientAppointment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-appointments', data.client_id] });
    },
  });
};
