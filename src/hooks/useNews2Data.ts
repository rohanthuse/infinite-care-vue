
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface News2Patient {
  id: string;
  client_id: string;
  branch_id: string;
  assigned_carer_id?: string;
  risk_category: 'low' | 'medium' | 'high';
  monitoring_frequency: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Related data
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth?: string;
  };
  assigned_carer?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  latest_observation?: News2Observation;
  observation_count?: number;
}

export interface News2Observation {
  id: string;
  news2_patient_id: string;
  recorded_by_staff_id: string;
  recorded_at: string;
  // Vital signs
  respiratory_rate?: number;
  oxygen_saturation?: number;
  supplemental_oxygen: boolean;
  systolic_bp?: number;
  pulse_rate?: number;
  consciousness_level: 'A' | 'V' | 'P' | 'U';
  temperature?: number;
  // Calculated scores
  respiratory_rate_score: number;
  oxygen_saturation_score: number;
  supplemental_oxygen_score: number;
  systolic_bp_score: number;
  pulse_rate_score: number;
  consciousness_level_score: number;
  temperature_score: number;
  total_score: number;
  risk_level: 'low' | 'medium' | 'high';
  // Clinical data
  clinical_notes?: string;
  action_taken?: string;
  next_review_time?: string;
  created_at: string;
  updated_at: string;
  // Related data
  recorded_by?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface News2Alert {
  id: string;
  news2_observation_id: string;
  news2_patient_id: string;
  alert_type: 'high_score' | 'deteriorating' | 'overdue_observation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export interface CreateObservationData {
  news2_patient_id: string;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  supplemental_oxygen: boolean;
  systolic_bp?: number;
  pulse_rate?: number;
  consciousness_level: 'A' | 'V' | 'P' | 'U';
  temperature?: number;
  clinical_notes?: string;
  action_taken?: string;
  next_review_time?: string;
}

// Fetch NEWS2 patients for a specific branch
const fetchNews2Patients = async (branchId: string): Promise<News2Patient[]> => {
  console.log(`[fetchNews2Patients] Fetching patients for branch: ${branchId}`);
  
  const { data, error } = await supabase
    .from('news2_patients')
    .select(`
      *,
      client:clients(
        id,
        first_name,
        last_name,
        date_of_birth
      ),
      assigned_carer:staff!assigned_carer_id(
        id,
        first_name,
        last_name
      )
    `)
    .eq('branch_id', branchId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching NEWS2 patients:', error);
    throw error;
  }

  // Fetch latest observations for each patient
  const patientsWithObservations = await Promise.all(
    (data || []).map(async (patient) => {
      const { data: latestObs } = await supabase
        .from('news2_observations')
        .select(`
          *,
          recorded_by:staff!recorded_by_staff_id(
            id,
            first_name,
            last_name
          )
        `)
        .eq('news2_patient_id', patient.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      const { count } = await supabase
        .from('news2_observations')
        .select('*', { count: 'exact', head: true })
        .eq('news2_patient_id', patient.id);

      return {
        ...patient,
        risk_category: patient.risk_category as 'low' | 'medium' | 'high',
        latest_observation: latestObs ? {
          ...latestObs,
          consciousness_level: latestObs.consciousness_level as 'A' | 'V' | 'P' | 'U',
          risk_level: latestObs.risk_level as 'low' | 'medium' | 'high'
        } : undefined,
        observation_count: count || 0
      };
    })
  );

  return patientsWithObservations;
};

// Fetch observations for a specific patient
const fetchPatientObservations = async (patientId: string): Promise<News2Observation[]> => {
  console.log(`[fetchPatientObservations] Fetching observations for patient: ${patientId}`);
  
  const { data, error } = await supabase
    .from('news2_observations')
    .select(`
      *,
      recorded_by:staff!recorded_by_staff_id(
        id,
        first_name,
        last_name
      )
    `)
    .eq('news2_patient_id', patientId)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('Error fetching patient observations:', error);
    throw error;
  }

  return (data || []).map(obs => ({
    ...obs,
    consciousness_level: obs.consciousness_level as 'A' | 'V' | 'P' | 'U',
    risk_level: obs.risk_level as 'low' | 'medium' | 'high'
  }));
};

// Create a new NEWS2 observation
const createNews2Observation = async (observationData: CreateObservationData): Promise<News2Observation> => {
  console.log(`[createNews2Observation] Creating observation:`, observationData);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('news2_observations')
    .insert({
      ...observationData,
      recorded_by_staff_id: user.id
    })
    .select(`
      *,
      recorded_by:staff!recorded_by_staff_id(
        id,
        first_name,
        last_name
      )
    `)
    .single();

  if (error) {
    console.error('Error creating NEWS2 observation:', error);
    throw error;
  }

  return {
    ...data,
    consciousness_level: data.consciousness_level as 'A' | 'V' | 'P' | 'U',
    risk_level: data.risk_level as 'low' | 'medium' | 'high'
  };
};

// Create a NEWS2 patient from existing client
const createNews2Patient = async (clientId: string, branchId: string, assignedCarerId?: string): Promise<News2Patient> => {
  console.log(`[createNews2Patient] Creating NEWS2 patient for client: ${clientId}`);
  
  const { data, error } = await supabase
    .from('news2_patients')
    .insert({
      client_id: clientId,
      branch_id: branchId,
      assigned_carer_id: assignedCarerId,
      risk_category: 'low',
      monitoring_frequency: 'daily',
      is_active: true
    })
    .select(`
      *,
      client:clients(
        id,
        first_name,
        last_name,
        date_of_birth
      ),
      assigned_carer:staff!assigned_carer_id(
        id,
        first_name,
        last_name
      )
    `)
    .single();

  if (error) {
    console.error('Error creating NEWS2 patient:', error);
    throw error;
  }

  return {
    ...data,
    risk_category: data.risk_category as 'low' | 'medium' | 'high'
  };
};

// Fetch alerts for a branch
const fetchNews2Alerts = async (branchId: string): Promise<News2Alert[]> => {
  console.log(`[fetchNews2Alerts] Fetching alerts for branch: ${branchId}`);
  
  const { data, error } = await supabase
    .from('news2_alerts')
    .select(`
      *,
      news2_patients!inner(branch_id)
    `)
    .eq('news2_patients.branch_id', branchId)
    .eq('resolved', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching NEWS2 alerts:', error);
    throw error;
  }

  return (data || []).map(alert => ({
    ...alert,
    alert_type: alert.alert_type as 'high_score' | 'deteriorating' | 'overdue_observation',
    severity: alert.severity as 'low' | 'medium' | 'high' | 'critical'
  }));
};

// Custom hooks
export const useNews2Patients = (branchId?: string) => {
  return useQuery({
    queryKey: ['news2-patients', branchId],
    queryFn: () => fetchNews2Patients(branchId!),
    enabled: Boolean(branchId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
};

export const usePatientObservations = (patientId?: string) => {
  return useQuery({
    queryKey: ['patient-observations', patientId],
    queryFn: () => fetchPatientObservations(patientId!),
    enabled: Boolean(patientId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useNews2Alerts = (branchId?: string) => {
  return useQuery({
    queryKey: ['news2-alerts', branchId],
    queryFn: () => fetchNews2Alerts(branchId!),
    enabled: Boolean(branchId),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useCreateNews2Observation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createNews2Observation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['news2-patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-observations', data.news2_patient_id] });
      queryClient.invalidateQueries({ queryKey: ['news2-alerts'] });
      
      toast.success('NEWS2 observation recorded successfully', {
        description: `Total score: ${data.total_score} (${data.risk_level} risk)`
      });
    },
    onError: (error) => {
      console.error('Error creating NEWS2 observation:', error);
      toast.error('Failed to record NEWS2 observation', {
        description: error.message || 'An error occurred while saving the observation'
      });
    }
  });
};

export const useCreateNews2Patient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clientId, branchId, assignedCarerId }: { 
      clientId: string; 
      branchId: string; 
      assignedCarerId?: string;
    }) => createNews2Patient(clientId, branchId, assignedCarerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news2-patients'] });
      toast.success('Patient added to NEWS2 monitoring successfully');
    },
    onError: (error) => {
      console.error('Error creating NEWS2 patient:', error);
      toast.error('Failed to add patient to NEWS2 monitoring', {
        description: error.message || 'An error occurred while adding the patient'
      });
    }
  });
};
