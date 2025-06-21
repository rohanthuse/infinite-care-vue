
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useReportTypeOptions = () => {
  return useQuery({
    queryKey: ['report-type-options'],
    queryFn: async () => {
      // First try to get from report_types table
      const { data: reportTypes, error } = await supabase
        .from('report_types')
        .select('title')
        .eq('status', 'Active')
        .order('title');
      
      if (error) {
        console.error('Error fetching report types:', error);
        // Fallback to static options if table doesn't exist or has issues
        return [
          { value: 'incident', label: 'Incident' },
          { value: 'accident', label: 'Accident' },
          { value: 'near_miss', label: 'Near Miss' },
          { value: 'medication_error', label: 'Medication Error' },
          { value: 'safeguarding', label: 'Safeguarding' },
          { value: 'complaint', label: 'Complaint' },
          { value: 'compliment', label: 'Compliment' },
          { value: 'medical_event', label: 'Medical Event' },
          { value: 'behavioral', label: 'Behavioral' },
          { value: 'safety_concern', label: 'Safety Concern' },
          { value: 'fall', label: 'Fall' },
          { value: 'other', label: 'Other' },
        ];
      }
      
      // Convert database results to option format
      return reportTypes.map(type => ({
        value: type.title.toLowerCase().replace(/\s+/g, '_'),
        label: type.title
      }));
    },
  });
};

export const useCommunicationTypeOptions = () => {
  return useQuery({
    queryKey: ['communication-type-options'],
    queryFn: async () => {
      return [
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone Call' },
        { value: 'sms', label: 'SMS' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'video_call', label: 'Video Call' },
        { value: 'letter', label: 'Letter' },
        { value: 'other', label: 'Other' },
      ];
    },
  });
};

export const useFileCategoryOptions = () => {
  return useQuery({
    queryKey: ['file-category-options'],
    queryFn: async () => {
      return [
        { value: 'medical_report', label: 'Medical Report' },
        { value: 'care_plan', label: 'Care Plan' },
        { value: 'legal_document', label: 'Legal Document' },
        { value: 'insurance', label: 'Insurance' },
        { value: 'assessment', label: 'Assessment' },
        { value: 'identification', label: 'Identification' },
        { value: 'consent_form', label: 'Consent Form' },
        { value: 'other', label: 'Other' },
      ];
    },
  });
};

export const useTravelRateOptions = () => {
  return useQuery({
    queryKey: ['travel-rate-options'],
    queryFn: async () => {
      return [
        { value: 'standard', label: 'Standard Rate' },
        { value: 'premium', label: 'Premium Rate' },
        { value: 'emergency', label: 'Emergency Rate' },
        { value: 'weekend', label: 'Weekend Rate' },
        { value: 'night', label: 'Night Rate' },
      ];
    },
  });
};

export const useParameterById = (id: string) => {
  return useQuery({
    queryKey: ['parameter-by-id', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('report_types')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching parameter by id:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!id,
  });
};
