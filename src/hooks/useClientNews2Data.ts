import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "./useClientAuth";

export interface ClientNews2Data {
  id: string;
  client_id: string;
  branch_id: string;
  risk_category: string;
  monitoring_frequency: string;
  notes: string | null;
  latest_observation?: {
    id: string;
    total_score: number;
    risk_level: 'low' | 'medium' | 'high';
    recorded_at: string;
    respiratory_rate: number;
    oxygen_saturation: number;
    supplemental_oxygen: boolean;
    systolic_bp: number;
    diastolic_bp?: number;
    pulse_rate: number;
    consciousness_level: string;
    temperature: number;
    ai_recommendations?: string;
  };
  observations_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClientNews2Observation {
  id: string;
  news2_patient_id: string;
  total_score: number;
  risk_level: string;
  recorded_at: string;
  respiratory_rate: number;
  respiratory_rate_score: number;
  oxygen_saturation: number;
  oxygen_saturation_score: number;
  supplemental_oxygen: boolean;
  supplemental_oxygen_score: number;
  systolic_bp: number;
  systolic_bp_score: number;
  diastolic_bp?: number;
  diastolic_bp_score: number;
  pulse_rate: number;
  pulse_rate_score: number;
  consciousness_level: string;
  consciousness_level_score: number;
  temperature: number;
  temperature_score: number;
  notes: string | null;
  recorded_by?: {
    first_name: string;
    last_name: string;
  };
}

export const useClientNews2Data = (overrideClientId?: string | null) => {
  const { clientId: authClientId, isAuthenticated } = useClientAuth();
  
  // Use override if provided, otherwise use authenticated client ID
  const clientId = overrideClientId || authClientId;
  // Enable query if we have a clientId (either from override or auth)
  const isEnabled = !!clientId && (!!overrideClientId || isAuthenticated);

  return useQuery({
    queryKey: ['client-news2-data', clientId],
    queryFn: async () => {
      if (!clientId) return null;

      // Get the NEWS2 patient record for this client
      const { data: patientData, error: patientError } = await supabase
        .from('news2_patients')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (patientError) {
        console.error('Error fetching NEWS2 patient:', patientError);
        return null;
      }

      if (!patientData) {
        console.log('No NEWS2 patient found for client:', clientId);
        return null;
      }

      // Get the latest observation for this patient
      const { data: latestObservation } = await supabase
        .from('news2_observations')
        .select(`
          id,
          total_score,
          risk_level,
          recorded_at,
          respiratory_rate,
          oxygen_saturation,
          supplemental_oxygen,
          systolic_bp,
          diastolic_bp,
          pulse_rate,
          consciousness_level,
          temperature,
          ai_recommendations
        `)
        .eq('news2_patient_id', patientData.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get the count of observations
      const { count: observationsCount } = await supabase
        .from('news2_observations')
        .select('*', { count: 'exact', head: true })
        .eq('news2_patient_id', patientData.id);

      // Transform the data to match our interface
      const transformedData = {
        ...patientData,
        latest_observation: latestObservation || undefined,
        observations_count: observationsCount || 0
      };

      return transformedData as ClientNews2Data;
    },
    enabled: isEnabled,
  });
};

export const useClientNews2History = (overrideClientId?: string | null) => {
  const { clientId: authClientId, isAuthenticated } = useClientAuth();
  
  // Use override if provided, otherwise use authenticated client ID
  const clientId = overrideClientId || authClientId;
  // Enable query if we have a clientId (either from override or auth)
  const isEnabled = !!clientId && (!!overrideClientId || isAuthenticated);

  return useQuery({
    queryKey: ['client-news2-history', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      // First get the NEWS2 patient record for this client
      const { data: news2Patient } = await supabase
        .from('news2_patients')
        .select('id')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle();

      if (!news2Patient) return [];

      // Then get all observations for this patient
      const { data, error } = await supabase
        .from('news2_observations')
        .select(`
          *,
          recorded_by:staff(first_name, last_name)
        `)
        .eq('news2_patient_id', news2Patient.id)
        .order('recorded_at', { ascending: false })
        .limit(30); // Last 30 observations

      if (error) {
        console.error('Error fetching client NEWS2 history:', error);
        return [];
      }

      // Transform the data to match our interface
      const transformedData = data?.map(obs => ({
        ...obs,
        notes: obs.clinical_notes || null
      })) || [];

      return transformedData as ClientNews2Observation[];
    },
    enabled: isEnabled,
  });
};