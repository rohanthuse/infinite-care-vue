import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VisitEvent {
  id: string;
  visit_record_id: string;
  event_type: 'incident' | 'accident' | 'near_miss' | 'medication_error' | 'fall' | 'injury' | 'behavioral' | 'emergency' | 'observation' | 'achievement';
  event_category?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  event_title: string;
  event_description: string;
  event_time: string;
  location_in_home?: string;
  immediate_action_taken?: string;
  follow_up_required: boolean;
  follow_up_notes?: string;
  reported_to?: string[];
  photos_taken: boolean;
  photo_urls?: string[];
  body_map_data?: any;
  witnesses?: string[];
  created_at: string;
  updated_at: string;
}

export const useVisitEvents = (visitRecordId?: string) => {
  const queryClient = useQueryClient();

  // Get all events for a visit - session-stable for long visits
  const { data: events, isLoading } = useQuery({
    queryKey: ['visit-events', visitRecordId],
    queryFn: async () => {
      if (!visitRecordId) return [];
      
      const { data, error } = await supabase
        .from('visit_events')
        .select('*')
        .eq('visit_record_id', visitRecordId)
        .order('event_time', { ascending: false });

      if (error) throw error;
      return data as VisitEvent[];
    },
    enabled: !!visitRecordId,
    // Session-stable: prevent unnecessary refetches during long visits
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Record an event
  const recordEvent = useMutation({
    mutationFn: async (eventData: Omit<VisitEvent, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('visit_events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visit-events', visitRecordId] });
      
      // Show appropriate toast based on severity
      if (data.severity === 'critical' || data.severity === 'high') {
        toast.error(`${data.event_type.toUpperCase()}: ${data.event_title}`, {
          description: 'High priority event recorded. Consider immediate action.',
        });
      } else {
        toast.success('Event recorded successfully');
      }
    },
    onError: (error) => {
      console.error('Error recording event:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to record event: ${errorMessage}`);
    },
  });

  // Update event (e.g., add follow-up notes)
  const updateEvent = useMutation({
    mutationFn: async ({ eventId, updates }: { eventId: string; updates: Partial<VisitEvent> }) => {
      const { data, error } = await supabase
        .from('visit_events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-events', visitRecordId] });
      toast.success('Event updated successfully');
    },
    onError: (error) => {
      console.error('Error updating event:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to update event: ${errorMessage}`);
    },
  });

  // Helper function to record common event types
  const recordIncident = (eventData: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    location?: string;
    immediateAction?: string;
    witnessedBy?: string[];
  }) => {
    if (!visitRecordId) return;

    recordEvent.mutate({
      visit_record_id: visitRecordId,
      event_type: 'incident',
      severity: eventData.severity,
      event_title: eventData.title,
      event_description: eventData.description,
      event_time: new Date().toISOString(),
      location_in_home: eventData.location,
      immediate_action_taken: eventData.immediateAction,
      follow_up_required: eventData.severity === 'high' || eventData.severity === 'critical',
      witnesses: eventData.witnessedBy,
      photos_taken: false,
    });
  };

  const recordAccident = (eventData: {
    title: string;
    description: string;
    location?: string;
    immediateAction?: string;
    injuryDetails?: any;
  }) => {
    if (!visitRecordId) return;

    recordEvent.mutate({
      visit_record_id: visitRecordId,
      event_type: 'accident',
      severity: 'high',
      event_title: eventData.title,
      event_description: eventData.description,
      event_time: new Date().toISOString(),
      location_in_home: eventData.location,
      immediate_action_taken: eventData.immediateAction,
      follow_up_required: true,
      body_map_data: eventData.injuryDetails,
      photos_taken: false,
    });
  };

  const recordObservation = (eventData: {
    title: string;
    description: string;
    category?: string;
  }) => {
    if (!visitRecordId) return;

    recordEvent.mutate({
      visit_record_id: visitRecordId,
      event_type: 'observation',
      severity: 'low',
      event_title: eventData.title,
      event_description: eventData.description,
      event_time: new Date().toISOString(),
      event_category: eventData.category,
      follow_up_required: false,
      photos_taken: false,
    });
  };

  // Categorize events
  const incidents = events?.filter(event => event.event_type === 'incident') || [];
  const accidents = events?.filter(event => event.event_type === 'accident') || [];
  const observations = events?.filter(event => event.event_type === 'observation') || [];
  const highPriorityEvents = events?.filter(event => event.severity === 'high' || event.severity === 'critical') || [];
  const eventsRequiringFollowUp = events?.filter(event => event.follow_up_required) || [];

  return {
    events,
    incidents,
    accidents,
    observations,
    highPriorityEvents,
    eventsRequiringFollowUp,
    isLoading,
    recordEvent,
    updateEvent,
    recordIncident,
    recordAccident,
    recordObservation,
  };
};
