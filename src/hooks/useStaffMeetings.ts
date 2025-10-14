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

      // Query for meetings where:
      // 1. client_id is NULL (staff-only meetings)
      // 2. The notes field contains the staff ID OR appointment type matches
      const { data, error } = await supabase
        .from('client_appointments')
        .select('*')
        .is('client_id', null)
        .or(`notes.ilike.%Staff ID: ${staffId}%,appointment_type.ilike.%Staff Meeting%,appointment_type.ilike.%Internal Meeting%`)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) {
        console.error('Error fetching staff meetings:', error);
        throw error;
      }

      // Filter to only include meetings that truly belong to this staff member
      const staffMeetings = (data || []).filter(meeting => {
        // Check if notes contain this staff's ID
        const notesContainStaffId = meeting.notes?.includes(`Staff ID: ${staffId}`);
        
        // For now, include all staff meetings, but in future we can be more strict
        const isStaffMeeting = meeting.appointment_type?.includes('Staff Meeting') || 
                               meeting.appointment_type?.includes('Internal Meeting');
        
        return notesContainStaffId || isStaffMeeting;
      });

      console.log('Staff meetings fetched:', staffMeetings);
      return staffMeetings as StaffMeeting[];
    },
    enabled: !!staffId,
  });
};
