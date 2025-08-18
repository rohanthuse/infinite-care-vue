
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/lib/tenant-context";

export const useReportTypeOptions = () => {
  const { currentOrganization } = useTenant();
  
  return useQuery({
    queryKey: ['report-type-options', currentOrganization?.id],
    queryFn: async () => {
      // First try to get from report_types table
      let query = supabase
        .from('report_types')
        .select('title, id')
        .eq('status', 'Active')
        .order('title');
      
      // Filter by organization if in tenant context
      if (currentOrganization?.id) {
        query = query.or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`);
      }
        
      const { data: reportTypes, error } = await query;
      
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
        value: type.id || type.title.toLowerCase().replace(/\s+/g, '_'),
        label: type.title
      }));
    },
  });
};

export const useCommunicationTypeOptions = () => {
  const { currentOrganization } = useTenant();
  
  return useQuery({
    queryKey: ['communication-type-options', currentOrganization?.id],
    queryFn: async () => {
      // First try to get from communication_types table
      let query = supabase
        .from('communication_types')
        .select('title, id')
        .eq('status', 'Active')
        .order('title');
      
      // Filter by organization if in tenant context
      if (currentOrganization?.id) {
        query = query.or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`);
      }
        
      const { data: communicationTypes, error } = await query;
      
      if (error) {
        console.error('Error fetching communication types:', error);
        // Fallback to static options if table doesn't exist or has issues
        return [
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone Call' },
          { value: 'sms', label: 'SMS' },
          { value: 'meeting', label: 'Meeting' },
          { value: 'video_call', label: 'Video Call' },
          { value: 'letter', label: 'Letter' },
          { value: 'other', label: 'Other' },
        ];
      }
      
      // Convert database results to option format
      return communicationTypes.map(type => ({
        value: type.id || type.title.toLowerCase().replace(/\s+/g, '_'),
        label: type.title
      }));
    },
  });
};

export const useFileCategoryOptions = () => {
  const { currentOrganization } = useTenant();
  
  return useQuery({
    queryKey: ['file-category-options', currentOrganization?.id],
    queryFn: async () => {
      // First try to get from file_categories table
      let query = supabase
        .from('file_categories')
        .select('title, id')
        .eq('status', 'Active')
        .order('title');
      
      // Filter by organization if in tenant context
      if (currentOrganization?.id) {
        query = query.or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`);
      }
        
      const { data: fileCategories, error } = await query;
      
      if (error) {
        console.error('Error fetching file categories:', error);
        // Fallback to static options if table doesn't exist or has issues
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
      }
      
      // Convert database results to option format
      return fileCategories.map(category => ({
        value: category.id || category.title.toLowerCase().replace(/\s+/g, '_'),
        label: category.title
      }));
    },
  });
};

// Hook for expense type options from database
export const useExpenseTypeOptions = () => {
  const { currentOrganization } = useTenant();
  
  return useQuery({
    queryKey: ['expense-type-options', currentOrganization?.id],
    queryFn: async () => {
      // First try to get from expense_types table
      let query = supabase
        .from('expense_types')
        .select('title, id')
        .eq('status', 'Active')
        .order('title');
      
      // Filter by organization if in tenant context
      if (currentOrganization?.id) {
        query = query.or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`);
      }
        
      const { data: expenseTypes, error } = await query;
      
      if (error) {
        console.error('Error fetching expense types:', error);
        // Fallback to static options if table doesn't exist or has issues
        return [
          { value: 'office_supplies', label: 'Office Supplies' },
          { value: 'travel', label: 'Travel' },
          { value: 'meals', label: 'Meals' },
          { value: 'equipment', label: 'Equipment' },
          { value: 'utilities', label: 'Utilities' },
          { value: 'rent', label: 'Rent' },
          { value: 'software', label: 'Software' },
          { value: 'training', label: 'Training' },
          { value: 'medical_supplies', label: 'Medical Supplies' },
          { value: 'other', label: 'Other' },
        ];
      }
      
      // Convert database results to option format
      return expenseTypes.map(type => ({
        value: type.id || type.title.toLowerCase().replace(/\s+/g, '_'),
        label: type.title
      }));
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
