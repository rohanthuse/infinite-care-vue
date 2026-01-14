
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientPersonalInfo {
  id: string;
  client_id: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  preferred_communication?: string;
  cultural_preferences?: string;
  language_preferences?: string;
  religion?: string;
  marital_status?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relationship?: string;
  gp_name?: string;
  gp_practice?: string;
  gp_phone?: string;
  // Background & Identity fields
  ethnicity?: string;
  sexual_orientation?: string;
  gender_identity?: string;
  nationality?: string;
  primary_language?: string;
  interpreter_required?: boolean;
  preferred_interpreter_language?: string;
  // My Home fields
  property_type?: string;
  living_arrangement?: string;
  home_accessibility?: string;
  pets?: string;
  key_safe_location?: string;
  parking_availability?: string;
  emergency_access?: string;
  has_key_safe?: boolean;
  // My Accessibility and Communication fields
  sensory_impairment?: string;
  communication_aids?: string;
  preferred_communication_method?: string;
  hearing_difficulties?: boolean;
  vision_difficulties?: boolean;
  speech_difficulties?: boolean;
  cognitive_impairment?: boolean;
  mobility_aids?: string;
  vision_description?: string;
  hearing_description?: string;
  how_i_communicate?: string;
  how_to_communicate_with_me?: string;
  communication_style?: string;
  // Do's & Don'ts fields
  likes_preferences?: string;
  dislikes_restrictions?: string;
  dos?: string;
  donts?: string;
  // My GP fields
  gp_surgery_name?: string;
  gp_surgery_address?: string;
  gp_surgery_phone?: string;
  gp_surgery_ods_code?: string;
  // Pharmacy fields
  pharmacy_name?: string;
  pharmacy_address?: string;
  pharmacy_phone?: string;
  pharmacy_ods_code?: string;
  // Desired outcomes fields
  personal_goals?: string;
  desired_outcomes?: string;
  success_measures?: string;
  priority_areas?: string;
  // General information fields
  main_reasons_for_care?: string;
  used_other_care_providers?: boolean;
  fallen_past_six_months?: boolean;
  has_assistance_device?: boolean;
  arrange_assistance_device?: boolean;
  bereavement_past_two_years?: boolean;
  warnings?: string[];
  instructions?: string[];
  important_occasions?: Array<{occasion?: string, date?: string}>;
  // Legal directives fields
  has_lpa?: boolean;
  lpa_type?: string;
  lpa_holder_name?: string;
  lpa_holder_phone?: string;
  lpa_holder_email?: string;
  has_dnr?: boolean;
  has_respect?: boolean;
  has_dols?: boolean;
  // Life & Personality fields
  life_history?: string;
  personality_traits?: string;
  created_at: string;
  updated_at: string;
}

const fetchClientPersonalInfo = async (clientId: string): Promise<ClientPersonalInfo | null> => {
  console.log('[fetchClientPersonalInfo] Fetching for client:', clientId);
  
  const { data, error } = await supabase
    .from('client_personal_info')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  if (error) {
    console.error('[fetchClientPersonalInfo] Error:', error);
    throw error;
  }

  if (!data) return null;

  // Parse JSONB fields properly - ensure arrays are always arrays
  return {
    ...data,
    important_occasions: Array.isArray(data.important_occasions) 
      ? data.important_occasions 
      : [],
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    instructions: Array.isArray(data.instructions) ? data.instructions : [],
  } as ClientPersonalInfo;
};

const upsertClientPersonalInfo = async (personalInfo: Partial<ClientPersonalInfo> & { client_id: string }) => {
  console.log('[upsertClientPersonalInfo] Upserting:', personalInfo);
  
  const { data: user } = await supabase.auth.getUser();
  console.log('[upsertClientPersonalInfo] Auth user ID:', user.user?.id);
  
  const { data, error } = await supabase
    .from('client_personal_info')
    .upsert(personalInfo, { onConflict: 'client_id' })
    .select()
    .maybeSingle();

  if (error) {
    console.error('[upsertClientPersonalInfo] Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to update personal information: ${error.message}`);
  }

  console.log('[upsertClientPersonalInfo] Success:', data);
  return data;
};

export const useClientPersonalInfo = (clientId: string) => {
  return useQuery({
    queryKey: ['client-personal-info', clientId],
    queryFn: () => fetchClientPersonalInfo(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateClientPersonalInfo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: upsertClientPersonalInfo,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-personal-info', data.client_id] });
    },
  });
};
