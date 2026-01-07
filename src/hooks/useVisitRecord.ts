import React from 'react';
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
  visit_photos?: string[];
  created_at: string;
  updated_at: string;
}

export const useVisitRecord = (bookingId?: string) => {
  const queryClient = useQueryClient();
  const [isLoadingTimeout, setIsLoadingTimeout] = React.useState(false);

  // Get current visit record for a booking - session-stable settings for long visits
  const { data: visitRecord, isLoading: queryLoading } = useQuery({
    queryKey: ['visit-record', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      
      // First try to get in-progress visit record
      const { data: inProgressRecord, error: inProgressError } = await supabase
        .from('visit_records')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('status', 'in_progress')
        .maybeSingle();

      if (inProgressError) throw inProgressError;
      
      // If in-progress record exists, return it
      if (inProgressRecord) {
        return inProgressRecord as VisitRecord;
      }
      
      // Fallback: get the most recent completed visit record for this booking
      const { data: completedRecord, error: completedError } = await supabase
        .from('visit_records')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('status', 'completed')
        .order('visit_end_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (completedError) throw completedError;
      return completedRecord as VisitRecord | null;
    },
    enabled: !!bookingId,
    // Session-stable: prevent unnecessary refetches during long visits (10-30 min)
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Timeout handling for loading state
  React.useEffect(() => {
    if (queryLoading) {
      const timeoutId = setTimeout(() => {
        console.warn('[useVisitRecord] Loading timeout reached after 10 seconds');
        setIsLoadingTimeout(true);
      }, 10000);

      return () => clearTimeout(timeoutId);
    } else {
      setIsLoadingTimeout(false);
    }
  }, [queryLoading]);

  const isLoading = queryLoading && !isLoadingTimeout;

  // Auto-create visit record for in-progress bookings
  const autoCreateVisitRecord = useMutation({
    mutationFn: async (bookingData: any) => {
      console.log('[autoCreateVisitRecord] Creating visit record for booking:', bookingData);
      
      // Validate required fields
      if (!bookingData.id || !bookingData.client_id || !bookingData.staff_id) {
        const missingFields = [];
        if (!bookingData.id) missingFields.push('booking_id');
        if (!bookingData.client_id) missingFields.push('client_id');
        if (!bookingData.staff_id) missingFields.push('staff_id');
        throw new Error(`Missing required fields for visit record: ${missingFields.join(', ')}`);
      }

      // Get branch_id if not provided
      let branchId = bookingData.branch_id;
      if (!branchId) {
        console.log('[autoCreateVisitRecord] Branch ID missing, fetching from booking');
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('branch_id')
          .eq('id', bookingData.id)
          .single();
        
        if (bookingError) {
          console.error('[autoCreateVisitRecord] Error fetching booking branch:', bookingError);
          throw new Error(`Failed to get branch information: ${bookingError.message}`);
        }
        
        branchId = booking?.branch_id;
      }

      if (!branchId) {
        throw new Error('Branch ID is required but not found');
      }

      const visitData = {
        booking_id: bookingData.id,
        client_id: bookingData.client_id,
        staff_id: bookingData.staff_id,
        branch_id: branchId,
        visit_start_time: new Date().toISOString(),
        status: 'in_progress' as const,
        completion_percentage: 0,
      };

      console.log('[autoCreateVisitRecord] Inserting visit data:', visitData);
      const { data, error } = await supabase
        .from('visit_records')
        .insert(visitData)
        .select()
        .single();

      if (error) {
        console.error('[autoCreateVisitRecord] Insert error:', error);
        throw new Error(`Failed to create visit record: ${error.message}`);
      }
      
      console.log('[autoCreateVisitRecord] Visit record created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('[autoCreateVisitRecord] Success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['visit-record', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['visit-record'] });
    },
    onError: (error) => {
      console.error('[autoCreateVisitRecord] Error:', error);
      toast.error(`Failed to create visit record: ${error.message}`);
    },
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

  // Complete visit with retry logic
  const completeVisit = useMutation<
    VisitRecord, 
    Error, 
    {
      visitRecordId: string;
      visitNotes?: string;
      clientSignature?: string;
      staffSignature?: string;
      visitSummary?: string;
      visitPhotos?: string[];
      retryCount?: number;
    }
  >({
    mutationFn: async ({ 
      visitRecordId, 
      visitNotes, 
      clientSignature, 
      staffSignature,
      visitSummary,
      visitPhotos,
      retryCount = 0
    }) => {
      console.log('[completeVisit] Starting completion attempt', { retryCount });
      
      const visitEndTime = new Date().toISOString();
      
      // Get visit start time to calculate duration
      const { data: visitRecord, error: fetchError } = await supabase
        .from('visit_records')
        .select('visit_start_time')
        .eq('id', visitRecordId)
        .single();

      if (fetchError) {
        console.error('[completeVisit] Error fetching visit record:', fetchError);
        throw fetchError;
      }

      let actualDurationMinutes;
      if (visitRecord) {
        const startTime = new Date(visitRecord.visit_start_time);
        const endTime = new Date(visitEndTime);
        actualDurationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      }

      const updateData = {
        status: 'completed' as const,
        visit_end_time: visitEndTime,
        actual_duration_minutes: actualDurationMinutes,
        visit_notes: visitNotes,
        client_signature_data: clientSignature,
        staff_signature_data: staffSignature,
        visit_summary: visitSummary,
        completion_percentage: 100,
        visit_photos: visitPhotos,
      };

      console.log('[completeVisit] Updating visit record with data:', updateData);

      try {
        const { data, error } = await supabase
          .from('visit_records')
          .update(updateData)
          .eq('id', visitRecordId)
          .select()
          .single();

        if (error) {
          console.error('[completeVisit] Update error:', error);
          // Propagate error to caller for unified retry handling
          throw error;
        }
        
        console.log('[completeVisit] Visit completed successfully:', data);
        return data as VisitRecord;
      } catch (error) {
        console.error('[completeVisit] Unexpected error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-record'] });
      queryClient.invalidateQueries({ queryKey: ['branch-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carer-appointments-full'] });
      toast.success('Visit completed successfully');
    },
    onError: (error: any) => {
      console.error('[completeVisit] Full error details:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      
      // Check for specific error types
      if (error?.message?.includes('timeout')) {
        toast.error('Database timeout. Please try again in a moment.');
      } else if (error?.message?.includes('policy')) {
        toast.error('Permission error. Please contact support.');
      } else if (error?.message?.includes('network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(`Failed to complete visit: ${error?.message || 'Unknown error'}`);
      }
    },
  });

  return {
    visitRecord,
    isLoading,
    createVisitRecord,
    updateVisitRecord,
    completeVisit,
    autoCreateVisitRecord,
  };
};