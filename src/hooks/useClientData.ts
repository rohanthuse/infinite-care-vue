
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientProfile {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  date_of_birth?: string;
  registered_on?: string;
  title?: string;
  middle_name?: string;
  mobile_number?: string;
  telephone_number?: string;
  country_code?: string;
  region?: string;
  gender?: string;
  age_group?: 'adult' | 'child' | 'young_person';
  pronouns?: string;
  referral_route?: string;
  other_identifier?: string;
  additional_information?: string;
  avatar_initials?: string;
  active_from?: string;
  active_until?: string;
}

export interface ClientCarePlan {
  id: string;
  display_id: string;
  title: string;
  provider_name: string;
  status: string;
  start_date: string;
  end_date?: string;
  review_date?: string;
  goals_progress?: number;
  updated_at: string;
}

export interface ClientAppointment {
  id: string;
  appointment_type: string;
  provider_name: string;
  appointment_date: string;
  appointment_time: string;
  location?: string;
  status: string;
  notes?: string;
}

export interface ClientBilling {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  invoice_date: string;
}

// Additional interfaces for the care plan system
export interface ClientPersonalInfo {
  id: string;
  client_id: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relationship?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  gp_name?: string;
  gp_practice?: string;
  gp_phone?: string;
  marital_status?: string;
  religion?: string;
  language_preferences?: string;
  cultural_preferences?: string;
  preferred_communication?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientMedicalInfo {
  id: string;
  client_id: string;
  medical_conditions?: string[];
  current_medications?: string[];
  allergies?: string[];
  medical_history?: string;
  mobility_status?: string;
  mental_health_status?: string;
  sensory_impairments?: string[];
  communication_needs?: string;
  cognitive_status?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientDietaryRequirements {
  id: string;
  client_id: string;
  dietary_restrictions?: string[];
  food_allergies?: string[];
  food_preferences?: string[];
  nutritional_needs?: string;
  supplements?: string[];
  meal_schedule?: any;
  feeding_assistance_required?: boolean;
  weight_monitoring?: boolean;
  fluid_restrictions?: string;
  texture_modifications?: string;
  special_equipment_needed?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientPersonalCare {
  id: string;
  client_id: string;
  bathing_preferences?: string;
  dressing_assistance_level?: string;
  toileting_assistance_level?: string;
  continence_status?: string;
  personal_hygiene_needs?: string;
  skin_care_needs?: string;
  pain_management?: string;
  comfort_measures?: string;
  sleep_patterns?: string;
  behavioral_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientAssessment {
  id: string;
  client_id: string;
  care_plan_id?: string;
  assessment_name: string;
  assessment_type: string;
  assessment_date: string;
  performed_by: string;
  performed_by_id?: string;
  score?: number;
  results?: string;
  recommendations?: string;
  next_review_date?: string;
  status: string;
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
  installation_date?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_schedule?: string;
  location?: string;
  status: string;
  notes?: string;
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
  start_date: string;
  end_date?: string;
  next_scheduled_date?: string;
  last_completed_date?: string;
  schedule_details?: string;
  goals?: string[];
  progress_status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Import the new client auth hook
import { useClientAuth } from './useClientAuth';

const fetchClientProfile = async (clientId: string): Promise<ClientProfile> => {
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    console.error('Error fetching client profile:', error);
    throw error;
  }

  return data;
};

const fetchClientCarePlans = async (clientId: string): Promise<ClientCarePlan[]> => {
  
  const { data, error } = await supabase
    .from('client_care_plans')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client care plans:', error);
    throw error;
  }

  return data || [];
};

const fetchClientAppointments = async (clientId: string): Promise<ClientAppointment[]> => {
  
  const { data, error } = await supabase
    .from('client_appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: true });

  if (error) {
    console.error('Error fetching client appointments:', error);
    throw error;
  }

  return data || [];
};

const fetchClientBilling = async (clientId: string): Promise<ClientBilling[]> => {
  
  const { data, error } = await supabase
    .from('client_billing')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'pending')
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching client billing:', error);
    throw error;
  }

  return data || [];
};

// Main hooks
export const useClientProfile = (clientId?: string) => {
  const { clientId: authenticatedClientId } = useClientAuth();
  const effectiveClientId = clientId || authenticatedClientId;
  
  return useQuery({
    queryKey: ['client-profile', effectiveClientId],
    queryFn: () => fetchClientProfile(effectiveClientId!),
    retry: 1,
    enabled: !!effectiveClientId,
  });
};

export const useClientCarePlans = (clientId?: string) => {
  const { clientId: authenticatedClientId } = useClientAuth();
  const effectiveClientId = clientId || authenticatedClientId;
  
  return useQuery({
    queryKey: ['client-care-plans', effectiveClientId],
    queryFn: () => fetchClientCarePlans(effectiveClientId!),
    retry: 1,
    enabled: !!effectiveClientId,
  });
};

export const useClientAppointments = (clientId?: string) => {
  const { clientId: authenticatedClientId } = useClientAuth();
  const effectiveClientId = clientId || authenticatedClientId;
  
  return useQuery({
    queryKey: ['client-appointments', effectiveClientId],
    queryFn: () => fetchClientAppointments(effectiveClientId!),
    retry: 1,
    enabled: !!effectiveClientId,
  });
};

export const useClientBilling = (clientId?: string) => {
  const { clientId: authenticatedClientId } = useClientAuth();
  const effectiveClientId = clientId || authenticatedClientId;
  
  return useQuery({
    queryKey: ['client-billing', effectiveClientId],
    queryFn: () => fetchClientBilling(effectiveClientId!),
    retry: 1,
    enabled: !!effectiveClientId,
  });
};

// Placeholder hooks for care plan system (these would need full implementation)
export const useClientPersonalInfo = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-personal-info', clientId],
    queryFn: async () => null,
    enabled: false,
  });
};

export const useClientMedicalInfo = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-medical-info', clientId],
    queryFn: async () => null,
    enabled: false,
  });
};

export const useClientDietaryRequirements = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-dietary-requirements', clientId],
    queryFn: async () => null,
    enabled: false,
  });
};

export const useClientPersonalCare = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-personal-care', clientId],
    queryFn: async () => null,
    enabled: false,
  });
};

export const useClientAssessments = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-assessments', clientId],
    queryFn: async () => [],
    enabled: false,
  });
};

export const useClientEquipment = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-equipment', clientId],
    queryFn: async () => [],
    enabled: false,
  });
};

export const useClientServiceActions = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-service-actions', clientId],
    queryFn: async () => [],
    enabled: false,
  });
};

// Fixed mutation hooks with proper parameter acceptance
export const useCreateClientNote = () => {
  return {
    mutate: (data: any) => {
      console.log('Creating client note:', data);
    },
    mutateAsync: async (data: any) => {
      console.log('Creating client note async:', data);
      return Promise.resolve();
    },
    isLoading: false,
    isPending: false,
  };
};

export const useCreateClientEvent = () => {
  return {
    mutate: (data: any) => {
      console.log('Creating client event:', data);
    },
    mutateAsync: async (data: any) => {
      console.log('Creating client event async:', data);
      return Promise.resolve();
    },
    isLoading: false,
    isPending: false,
  };
};

export const useCreateGoal = () => {
  return {
    mutate: (data: any) => {
      console.log('Creating goal:', data);
    },
    mutateAsync: async (data: any) => {
      console.log('Creating goal async:', data);
      return Promise.resolve();
    },
    isLoading: false,
    isPending: false,
  };
};

export const useCreateClientActivity = () => {
  return {
    mutate: (data: any) => {
      console.log('Creating client activity:', data);
    },
    mutateAsync: async (data: any) => {
      console.log('Creating client activity async:', data);
      return Promise.resolve();
    },
    isLoading: false,
    isPending: false,
  };
};

export const useCreateClientEquipment = () => {
  return {
    mutate: (data: any) => {
      console.log('Creating client equipment:', data);
    },
    mutateAsync: async (data: any) => {
      console.log('Creating client equipment async:', data);
      return Promise.resolve();
    },
    isLoading: false,
    isPending: false,
  };
};

export const useCreateClientAssessment = () => {
  return {
    mutate: (data: any) => {
      console.log('Creating client assessment:', data);
    },
    mutateAsync: async (data: any) => {
      console.log('Creating client assessment async:', data);
      return Promise.resolve();
    },
    isLoading: false,
    isPending: false,
  };
};

export const useUpdateClientProfile = () => {
  return {
    mutate: (data: any) => {
      console.log('Updating client profile:', data);
    },
    mutateAsync: async (data: any) => {
      console.log('Updating client profile async:', data);
      return Promise.resolve();
    },
    isLoading: false,
    isPending: false,
  };
};
