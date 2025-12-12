import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BookingAlertSettings {
  id: string;
  organization_id: string | null;
  branch_id: string | null;
  first_alert_delay_minutes: number;
  missed_booking_threshold_minutes: number;
  enable_late_start_alerts: boolean;
  enable_missed_booking_alerts: boolean;
  created_at: string;
  updated_at: string;
}

export const useBookingAlertSettings = (organizationId?: string, branchId?: string) => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['booking-alert-settings', organizationId, branchId],
    queryFn: async () => {
      let query = supabase
        .from('booking_alert_settings')
        .select('*');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        console.error('[useBookingAlertSettings] Error fetching settings:', error);
        throw error;
      }

      // Return default settings if none exist
      if (!data) {
        return {
          id: '',
          organization_id: organizationId || null,
          branch_id: branchId || null,
          first_alert_delay_minutes: 0,
          missed_booking_threshold_minutes: 3,
          enable_late_start_alerts: true,
          enable_missed_booking_alerts: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as BookingAlertSettings;
      }

      return data as BookingAlertSettings;
    },
    enabled: !!organizationId || !!branchId,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<BookingAlertSettings>) => {
      if (settings?.id) {
        // Update existing settings
        const { data, error } = await supabase
          .from('booking_alert_settings')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('booking_alert_settings')
          .insert({
            organization_id: organizationId || null,
            branch_id: branchId || null,
            ...updates,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-alert-settings'] });
      toast.success('Alert settings updated successfully');
    },
    onError: (error) => {
      console.error('[useBookingAlertSettings] Error updating settings:', error);
      toast.error('Failed to update alert settings');
    },
  });

  return {
    settings: settings || {
      id: '',
      organization_id: organizationId || null,
      branch_id: branchId || null,
      first_alert_delay_minutes: 0,
      missed_booking_threshold_minutes: 3,
      enable_late_start_alerts: true,
      enable_missed_booking_alerts: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
};
