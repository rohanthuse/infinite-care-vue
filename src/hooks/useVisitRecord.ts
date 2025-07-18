import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VisitRecord {
  id: string;
  booking_id: string;
  client_id: string;
  staff_id: string;
  branch_id: string;
  visit_start_time: string;
  visit_end_time?: string;
  actual_duration_minutes?: number;
  status: 'in_progress' | 'completed' | 'cancelled' | 'interrupted';
  visit_notes?: string;
  client_signature_data?: string;
  staff_signature_data?: string;
  location_data?: any;
  visit_summary?: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export const useVisitRecord = (bookingId?: string) => {
  const queryClient = useQueryClient();

  // Get current visit record for a booking
  const { data: visitRecord, isLoading } = useQuery({
    queryKey: ['visit-record', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      
      const { data, error } = await supabase
        .from('visit_records')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('status', 'in_progress')
        .maybeSingle();

      if (error) throw error;
      return data as VisitRecord | null;
    },
    enabled: !!bookingId,
  });

  // Create a new visit record
  const createVisitRecord = useMutation({
    mutationFn: async (visitData: Omit<VisitRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('visit_records')
        .insert(visitData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-record'] });
      toast.success('Visit record created successfully');
    },
    onError: (error) => {
      console.error('Error creating visit record:', error);
      toast.error('Failed to create visit record');
    },
  });

  // Update visit record
  const updateVisitRecord = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VisitRecord> }) => {
      const { data, error } = await supabase
        .from('visit_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-record'] });
    },
    onError: (error) => {
      console.error('Error updating visit record:', error);
      toast.error('Failed to update visit record');
    },
  });

  // Complete visit
  const completeVisit = useMutation({
    mutationFn: async ({ 
      visitRecordId, 
      visitNotes, 
      clientSignature, 
      staffSignature,
      visitSummary 
    }: {
      visitRecordId: string;
      visitNotes?: string;
      clientSignature?: string;
      staffSignature?: string;
      visitSummary?: string;
    }) => {
      const visitEndTime = new Date().toISOString();
      
      // Get visit start time to calculate duration
      const { data: visitRecord } = await supabase
        .from('visit_records')
        .select('visit_start_time')
        .eq('id', visitRecordId)
        .single();

      let actualDurationMinutes;
      if (visitRecord) {
        const startTime = new Date(visitRecord.visit_start_time);
        const endTime = new Date(visitEndTime);
        actualDurationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      }

      const { data, error } = await supabase
        .from('visit_records')
        .update({
          status: 'completed',
          visit_end_time: visitEndTime,
          actual_duration_minutes: actualDurationMinutes,
          visit_notes: visitNotes,
          client_signature_data: clientSignature,
          staff_signature_data: staffSignature,
          visit_summary: visitSummary,
          completion_percentage: 100,
        })
        .eq('id', visitRecordId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-record'] });
      queryClient.invalidateQueries({ queryKey: ['branch-bookings'] });
      toast.success('Visit completed successfully');
    },
    onError: (error) => {
      console.error('Error completing visit:', error);
      toast.error('Failed to complete visit');
    },
  });

  return {
    visitRecord,
    isLoading,
    createVisitRecord,
    updateVisitRecord,
    completeVisit,
  };
};