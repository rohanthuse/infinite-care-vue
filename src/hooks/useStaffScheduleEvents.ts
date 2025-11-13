import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface StaffTrainingEvent {
  id: string;
  type: 'training';
  staff_id: string;
  assigned_date: string;
  training_notes: string | null;
  status: string;
  training_courses: {
    title: string;
    category: string;
  };
}

export interface StaffAppointmentEvent {
  id: string;
  type: 'appointment';
  staff_id: string | null;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  provider_name: string;
  location: string;
  status: string;
  notes: string | null;
}

export type StaffEvent = StaffTrainingEvent | StaffAppointmentEvent;

const fetchStaffEvents = async (
  branchId: string,
  date: Date,
  staffIds: string[]
): Promise<StaffEvent[]> => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const events: StaffEvent[] = [];

  // Fetch training records
  const { data: trainings, error: trainingError } = await supabase
    .from('staff_training_records')
    .select(`
      id,
      staff_id,
      assigned_date,
      training_notes,
      status,
      training_courses (
        title,
        category
      )
    `)
    .eq('branch_id', branchId)
    .eq('assigned_date', dateStr)
    .in('staff_id', staffIds);

  if (!trainingError && trainings) {
    events.push(...trainings.map(t => ({ ...t, type: 'training' as const })));
  }

  // Fetch client appointments
  const { data: appointments, error: appointmentError } = await supabase
    .from('client_appointments')
    .select('*')
    .eq('branch_id', branchId)
    .eq('appointment_date', dateStr);

  if (!appointmentError && appointments) {
    // Filter appointments that involve our staff members
    const staffAppointments = appointments
      .filter(apt => {
        if (apt.notes) {
          const staffIdMatch = apt.notes.match(/Staff ID: ([a-f0-9-]+)/);
          return staffIdMatch && staffIds.includes(staffIdMatch[1]);
        }
        return false;
      })
      .map(apt => {
        // Extract staff ID from notes
        const staffIdMatch = apt.notes!.match(/Staff ID: ([a-f0-9-]+)/);
        return {
          ...apt,
          staff_id: staffIdMatch ? staffIdMatch[1] : null,
          type: 'appointment' as const
        };
      });
    
    events.push(...staffAppointments);
  }

  return events;
};

export const useStaffScheduleEvents = (
  branchId?: string,
  date?: Date,
  staffIds?: string[]
) => {
  return useQuery({
    queryKey: ['staff-schedule-events', branchId, date?.toISOString(), staffIds],
    queryFn: () => fetchStaffEvents(branchId!, date!, staffIds!),
    enabled: !!branchId && !!date && !!staffIds && staffIds.length > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
};
