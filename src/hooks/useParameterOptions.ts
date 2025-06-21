
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
