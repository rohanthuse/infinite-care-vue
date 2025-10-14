import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffMeeting {
  id: string;
  appointment_type: string;
  appointment_date: string;
  appointment_time: string;
  location: string;
  status: string;
  notes?: string;
  provider_name: string;
  client_id: string | null;
  branch_id: string;
  created_at: string;
}

export const useStaffMeetings = (staffId: string) => {
  return useQuery({
    queryKey: ['staff-meetings', staffId],
    queryFn: async () => {
      if (!staffId) {
        return [];
      }

      // Query for ALL meetings where this staff is involved (via notes)
      // This includes both staff-only meetings (client_id = null) AND client meetings where staff is assigned
      const { data, error } = await supabase
        .from('client_appointments')
        .select('*')
        .or(`notes.ilike.%Staff ID: ${staffId}%,appointment_type.ilike.%Staff Meeting%,appointment_type.ilike.%Internal Meeting%,appointment_type.ilike.%Client Meeting%,appointment_type.ilike.%Personal Meeting%,appointment_type.ilike.%Third Party Meeting%`)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) {
        console.error('Error fetching staff meetings:', error);
        throw error;
      }

      // Filter to only include meetings where this specific staff member is referenced in notes
      const staffMeetings = (data || []).filter(meeting => {
        return meeting.notes?.includes(`Staff ID: ${staffId}`);
      });

      console.log('Staff meetings fetched:', staffMeetings);
      return staffMeetings as StaffMeeting[];
    },
    enabled: !!staffId,
  });
};
