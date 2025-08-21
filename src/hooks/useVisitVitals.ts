import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VisitVital {
  id: string;
  visit_record_id: string;
  client_id: string;
  reading_time: string;
  vital_type: 'news2' | 'blood_pressure' | 'temperature' | 'weight' | 'blood_sugar' | 'other';
  
  // NEWS2 fields
  respiratory_rate?: number;
  oxygen_saturation?: number;
  supplemental_oxygen?: boolean;
  systolic_bp?: number;
  diastolic_bp?: number;
  pulse_rate?: number;
  consciousness_level?: 'A' | 'V' | 'P' | 'U';
  temperature?: number;
  news2_total_score?: number;
  news2_risk_level?: 'low' | 'medium' | 'high';
  
  // Other vitals
  weight_kg?: number;
  blood_sugar_mmol?: number;
  other_readings?: any;
  
  notes?: string;
  taken_by?: string;
  verified_by?: string;
  created_at: string;
}

export const useVisitVitals = (visitRecordId?: string, clientId?: string) => {
  const queryClient = useQueryClient();

  // Get all vitals for a visit
  const { data: vitals, isLoading } = useQuery({
    queryKey: ['visit-vitals', visitRecordId],
    queryFn: async () => {
      if (!visitRecordId) return [];
      
      const { data, error } = await supabase
        .from('visit_vitals')
        .select('*')
        .eq('visit_record_id', visitRecordId)
        .order('reading_time', { ascending: false });

      if (error) throw error;
      return data as VisitVital[];
    },
    enabled: !!visitRecordId,
  });

  // Record vital signs
  const recordVitals = useMutation({
    mutationFn: async (vitalData: Omit<VisitVital, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('visit_vitals')
        .insert(vitalData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visit-vitals', visitRecordId] });
      
      // Alert for high risk NEWS2 scores
      if (data.vital_type === 'news2' && data.news2_risk_level === 'high') {
        toast.error('HIGH RISK NEWS2 Score!', {
          description: `Score: ${data.news2_total_score}. Consider immediate medical attention.`,
        });
      } else {
        toast.success('Vital signs recorded successfully');
      }
    },
    onError: (error) => {
      console.error('Error recording vitals:', error);
      const errorMessage = error?.message || 'Failed to record vital signs';
      toast.error(`Failed to record vital signs: ${errorMessage}`);
    },
  });

  // Calculate NEWS2 score
  const calculateNEWS2Score = (vitals: {
    respiratory_rate: number;
    oxygen_saturation: number;
    supplemental_oxygen: boolean;
    systolic_bp: number;
    pulse_rate: number;
    consciousness_level: 'A' | 'V' | 'P' | 'U';
    temperature: number;
  }) => {
    let score = 0;

    // Respiratory Rate
    if (vitals.respiratory_rate <= 8) score += 3;
    else if (vitals.respiratory_rate <= 11) score += 1;
    else if (vitals.respiratory_rate <= 20) score += 0;
    else if (vitals.respiratory_rate <= 24) score += 2;
    else score += 3;

    // Oxygen Saturation
    if (vitals.oxygen_saturation <= 91) score += 3;
    else if (vitals.oxygen_saturation <= 93) score += 2;
    else if (vitals.oxygen_saturation <= 95) score += 1;
    else score += 0;

    // Supplemental Oxygen
    if (vitals.supplemental_oxygen) score += 2;

    // Blood Pressure
    if (vitals.systolic_bp <= 90) score += 3;
    else if (vitals.systolic_bp <= 100) score += 2;
    else if (vitals.systolic_bp <= 110) score += 1;
    else if (vitals.systolic_bp <= 219) score += 0;
    else score += 3;

    // Pulse Rate
    if (vitals.pulse_rate <= 40) score += 3;
    else if (vitals.pulse_rate <= 50) score += 1;
    else if (vitals.pulse_rate <= 90) score += 0;
    else if (vitals.pulse_rate <= 110) score += 1;
    else if (vitals.pulse_rate <= 130) score += 2;
    else score += 3;

    // Consciousness Level
    if (vitals.consciousness_level === 'A') score += 0;
    else score += 3;

    // Temperature
    if (vitals.temperature <= 35.0) score += 3;
    else if (vitals.temperature <= 36.0) score += 1;
    else if (vitals.temperature <= 38.0) score += 0;
    else if (vitals.temperature <= 39.0) score += 1;
    else score += 2;

    // Risk Level
    let riskLevel: 'low' | 'medium' | 'high';
    if (score >= 7) riskLevel = 'high';
    else if (score >= 5) riskLevel = 'medium';
    else riskLevel = 'low';

    return { score, riskLevel };
  };

  // Record NEWS2 reading
  const recordNEWS2 = useMutation({
    mutationFn: async (news2Data: {
      respiratory_rate: number;
      oxygen_saturation: number;
      supplemental_oxygen: boolean;
      systolic_bp: number;
      diastolic_bp: number;
      pulse_rate: number;
      consciousness_level: 'A' | 'V' | 'P' | 'U';
      temperature: number;
      notes?: string;
      taken_by?: string;
    }) => {
      if (!visitRecordId || !clientId) throw new Error('Visit record ID and client ID required');

      const { score, riskLevel } = calculateNEWS2Score(news2Data);

      const vitalData: Omit<VisitVital, 'id' | 'created_at'> = {
        visit_record_id: visitRecordId,
        client_id: clientId,
        reading_time: new Date().toISOString(),
        vital_type: 'news2',
        respiratory_rate: news2Data.respiratory_rate,
        oxygen_saturation: news2Data.oxygen_saturation,
        supplemental_oxygen: news2Data.supplemental_oxygen,
        systolic_bp: news2Data.systolic_bp,
        diastolic_bp: news2Data.diastolic_bp,
        pulse_rate: news2Data.pulse_rate,
        consciousness_level: news2Data.consciousness_level,
        temperature: news2Data.temperature,
        news2_total_score: score,
        news2_risk_level: riskLevel,
        notes: news2Data.notes,
        taken_by: news2Data.taken_by,
      };

      return recordVitals.mutateAsync(vitalData);
    },
  });

  // Get latest NEWS2 reading
  const latestNEWS2 = vitals?.find(vital => vital.vital_type === 'news2');
  const news2Readings = vitals?.filter(vital => vital.vital_type === 'news2') || [];
  const otherVitals = vitals?.filter(vital => vital.vital_type !== 'news2') || [];

  return {
    vitals,
    news2Readings,
    otherVitals,
    latestNEWS2,
    isLoading,
    recordVitals,
    recordNEWS2,
    calculateNEWS2Score,
  };
};
