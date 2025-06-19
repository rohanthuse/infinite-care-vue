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

export interface ClientPersonalInfo {
  id: string;
  client_id: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relationship?: string;
  gp_name?: string;
  gp_practice?: string;
  gp_phone?: string;
  preferred_communication?: string;
  cultural_preferences?: string;
  language_preferences?: string;
  religion?: string;
  marital_status?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientMedicalInfo {
  id: string;
  client_id: string;
  allergies?: string[];
  medical_conditions?: string[];
  current_medications?: string[];
  medical_history?: string;
  mobility_status?: string;
  cognitive_status?: string;
  mental_health_status?: string;
  communication_needs?: string;
  sensory_impairments?: string[];
  created_at: string;
  updated_at: string;
}

export interface ClientDietaryRequirements {
  id: string;
  client_id: string;
  dietary_restrictions?: string[];
  food_allergies?: string[];
  food_preferences?: string[];
  meal_schedule?: any;
  nutritional_needs?: string;
  supplements?: string[];
  feeding_assistance_required?: boolean;
  special_equipment_needed?: string;
  texture_modifications?: string;
  fluid_restrictions?: string;
  weight_monitoring?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientPersonalCare {
  id: string;
  client_id: string;
  personal_hygiene_needs?: string;
  bathing_preferences?: string;
  dressing_assistance_level?: string;
  toileting_assistance_level?: string;
  continence_status?: string;
  sleep_patterns?: string;
  behavioral_notes?: string;
  comfort_measures?: string;
  pain_management?: string;
  skin_care_needs?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientAssessment {
  id: string;
  client_id: string;
  assessment_name: string;
  assessment_type: string;
  assessment_date: string;
  performed_by: string;
  performed_by_id?: string;
  status: string;
  score?: number;
  results?: string;
  recommendations?: string;
  care_plan_id?: string;
  next_review_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientEquipment {
  id: string;
  client_id: string;
  equipment_name: string;
  equipment_type: string;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  status: string;
  location?: string;
  installation_date?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_schedule?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientRiskAssessment {
  id: string;
  client_id: string;
  risk_type: string;
  risk_level: string;
  assessment_date: string;
  assessed_by: string;
  status: string;
  risk_factors?: string[];
  mitigation_strategies?: string[];
  review_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientServiceAction {
  id: string;
  client_id: string;
  care_plan_id?: string;
  service_name: string;
  service_category: string;
  provider_name: string;
  frequency: string;
  duration: string;
  schedule_details?: string;
  goals?: string[];
  progress_status: string;
  start_date: string;
  end_date?: string;
  last_completed_date?: string;
  next_scheduled_date?: string;
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

const fetchClientPersonalInfo = async (clientId: string) => {
  const response = await supabase
    .from('client_personal_info')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  if (response.error) throw response.error;
  return response.data;
};

const fetchClientMedicalInfo = async (clientId: string) => {
  const response = await supabase
    .from('client_medical_info')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  if (response.error) throw response.error;
  return response.data;
};

const fetchClientDietaryRequirements = async (clientId: string) => {
  const response = await supabase
    .from('client_dietary_requirements')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  if (response.error) throw response.error;
  return response.data;
};

const fetchClientPersonalCare = async (clientId: string) => {
  const response = await supabase
    .from('client_personal_care')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  if (response.error) throw response.error;
  return response.data;
};

const fetchClientAssessments = async (clientId: string) => {
  const response = await supabase
    .from('client_assessments')
    .select('*')
    .eq('client_id', clientId)
    .order('assessment_date', { ascending: false });

  if (response.error) throw response.error;
  return response.data || [];
};

const fetchClientEquipment = async (clientId: string) => {
  const response = await supabase
    .from('client_equipment')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (response.error) throw response.error;
  return response.data || [];
};

const fetchClientRiskAssessments = async (clientId: string) => {
  const response = await supabase
    .from('client_risk_assessments')
    .select('*')
    .eq('client_id', clientId)
    .order('assessment_date', { ascending: false });

  if (response.error) throw response.error;
  return response.data || [];
};

const fetchClientServiceActions = async (clientId: string) => {
  const response = await supabase
    .from('client_service_actions')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

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

export const useClientPersonalInfo = (clientId: string) => {
  const config = {
    queryKey: ['client-personal-info', clientId] as const,
    queryFn: () => fetchClientPersonalInfo(clientId),
    enabled: Boolean(clientId),
  };
  
  return useQuery(config);
};

export const useClientMedicalInfo = (clientId: string) => {
  const config = {
    queryKey: ['client-medical-info', clientId] as const,
    queryFn: () => fetchClientMedicalInfo(clientId),
    enabled: Boolean(clientId),
  };
  
  return useQuery(config);
};

export const useClientDietaryRequirements = (clientId: string) => {
  const config = {
    queryKey: ['client-dietary-requirements', clientId] as const,
    queryFn: () => fetchClientDietaryRequirements(clientId),
    enabled: Boolean(clientId),
  };
  
  return useQuery(config);
};

export const useClientPersonalCare = (clientId: string) => {
  const config = {
    queryKey: ['client-personal-care', clientId] as const,
    queryFn: () => fetchClientPersonalCare(clientId),
    enabled: Boolean(clientId),
  };
  
  return useQuery(config);
};

export const useClientAssessments = (clientId: string) => {
  const config = {
    queryKey: ['client-assessments', clientId] as const,
    queryFn: () => fetchClientAssessments(clientId),
    enabled: Boolean(clientId),
  };
  
  return useQuery(config);
};

export const useClientEquipment = (clientId: string) => {
  const config = {
    queryKey: ['client-equipment', clientId] as const,
    queryFn: () => fetchClientEquipment(clientId),
    enabled: Boolean(clientId),
  };
  
  return useQuery(config);
};

export const useClientRiskAssessments = (clientId: string) => {
  const config = {
    queryKey: ['client-risk-assessments', clientId] as const,
    queryFn: () => fetchClientRiskAssessments(clientId),
    enabled: Boolean(clientId),
  };
  
  return useQuery(config);
};

export const useClientServiceActions = (clientId: string) => {
  const config = {
    queryKey: ['client-service-actions', clientId] as const,
    queryFn: () => fetchClientServiceActions(clientId),
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
