import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "./useClientAuth";

export interface ClientVisitVitalRecord {
  id: string;
  visit_record_id: string;
  client_id: string;
  reading_time: string;
  vital_type: string;
  
  // NEWS2 fields
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
  supplemental_oxygen: boolean;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  pulse_rate: number | null;
  consciousness_level: string | null;
  temperature: number | null;
  news2_total_score: number | null;
  news2_risk_level: string | null;
  
  notes: string | null;
  taken_by: string | null;
  created_at: string;
  
  // Visit context
  visit_record?: {
    id: string;
    booking_id: string | null;
    visit_start_time: string | null;
    visit_end_time: string | null;
    booking?: {
      id: string;
      start_time: string;
      end_time: string;
      staff_id: string | null;
      staff?: {
        id: string;
        first_name: string;
        last_name: string;
      } | null;
    } | null;
  } | null;
  
  // Staff who recorded (taken_by)
  recorded_by_staff?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

// Transformed record for display
export interface DisplayVitalRecord {
  id: string;
  recorded_at: string;
  total_score: number;
  risk_level: string;
  
  // Vitals
  respiratory_rate: number;
  oxygen_saturation: number;
  supplemental_oxygen: boolean;
  systolic_bp: number;
  diastolic_bp?: number;
  pulse_rate: number;
  consciousness_level: string;
  temperature: number;
  
  notes: string | null;
  
  // Visit context
  visit_date?: string;
  visit_time?: string;
  booking_id?: string;
  booking_reference?: string;
  carer_name?: string;
  carer_first_name?: string;
  carer_last_name?: string;
  
  // Source identifier
  source: 'visit_vitals' | 'news2_observations';
}

/**
 * Hook to fetch NEWS2 readings from visit_vitals table for a specific client.
 * This captures readings made by carers during visits.
 */
export const useClientVisitVitals = (overrideClientId?: string | null) => {
  const { clientId: authClientId, isAuthenticated } = useClientAuth();
  
  const clientId = overrideClientId || authClientId;
  const isEnabled = !!clientId && (!!overrideClientId || isAuthenticated);

  return useQuery({
    queryKey: ['client-visit-vitals', clientId],
    queryFn: async (): Promise<DisplayVitalRecord[]> => {
      if (!clientId) return [];

      // Fetch visit vitals with related visit records, bookings, and staff
      const { data, error } = await supabase
        .from('visit_vitals')
        .select(`
          id,
          visit_record_id,
          client_id,
          reading_time,
          vital_type,
          respiratory_rate,
          oxygen_saturation,
          supplemental_oxygen,
          systolic_bp,
          diastolic_bp,
          pulse_rate,
          consciousness_level,
          temperature,
          news2_total_score,
          news2_risk_level,
          notes,
          taken_by,
          created_at,
          visit_records!inner (
            id,
            booking_id,
            visit_start_time,
            visit_end_time,
            bookings (
              id,
              start_time,
              end_time,
              staff_id,
              staff (
                id,
                first_name,
                last_name
              )
            )
          )
        `)
        .eq('client_id', clientId)
        .eq('vital_type', 'news2')
        .order('reading_time', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[useClientVisitVitals] Error fetching visit vitals:', error);
        return [];
      }

      // Transform the data to match our display interface
      const transformedData: DisplayVitalRecord[] = (data || []).map((vital: any) => {
        const visitRecord = vital.visit_records;
        const booking = visitRecord?.bookings;
        const staff = booking?.staff;
        
        return {
          id: vital.id,
          recorded_at: vital.reading_time,
          total_score: vital.news2_total_score || 0,
          risk_level: vital.news2_risk_level || 'low',
          
          // Vitals
          respiratory_rate: vital.respiratory_rate || 0,
          oxygen_saturation: vital.oxygen_saturation || 0,
          supplemental_oxygen: vital.supplemental_oxygen || false,
          systolic_bp: vital.systolic_bp || 0,
          diastolic_bp: vital.diastolic_bp,
          pulse_rate: vital.pulse_rate || 0,
          consciousness_level: vital.consciousness_level || 'A',
          temperature: vital.temperature || 0,
          
          notes: vital.notes,
          
          // Visit context
          visit_date: booking?.start_time,
          visit_time: booking?.start_time,
          booking_id: booking?.id,
          booking_reference: booking?.id ? booking.id.slice(0, 8).toUpperCase() : undefined,
          carer_name: staff ? `${staff.first_name} ${staff.last_name}` : undefined,
          carer_first_name: staff?.first_name,
          carer_last_name: staff?.last_name,
          
          source: 'visit_vitals' as const,
        };
      });

      return transformedData;
    },
    enabled: isEnabled,
  });
};

/**
 * Hook to get the latest NEWS2 reading from visit_vitals for dashboard display
 */
export const useClientLatestVisitVital = (overrideClientId?: string | null) => {
  const { data: visitVitals, isLoading, error } = useClientVisitVitals(overrideClientId);
  
  const latestVital = visitVitals && visitVitals.length > 0 ? visitVitals[0] : null;
  
  return {
    data: latestVital,
    isLoading,
    error,
    totalCount: visitVitals?.length || 0,
  };
};
