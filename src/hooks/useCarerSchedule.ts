
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getClientName } from '@/utils/clientDataHelpers';

export interface CarerScheduleData {
  availableHours: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
  workingPattern: string;
  totalHoursPerWeek: number;
  nextShift: {
    date: string;
    time: string;
    client: string;
  } | null;
}

const fetchCarerSchedule = async (carerId: string): Promise<CarerScheduleData> => {
  console.log('[fetchCarerSchedule] Fetching schedule for carer:', carerId);
  
  // Get carer's availability pattern from staff table
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('availability')
    .eq('id', carerId)
    .single();

  if (staffError) {
    console.error('[fetchCarerSchedule] Staff error:', staffError);
    throw staffError;
  }

  // Get upcoming bookings for schedule
  const { data: upcomingBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      start_time,
      end_time,
      clients (first_name, last_name)
    `)
    .eq('staff_id', carerId)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(1);

  if (bookingsError) {
    console.error('[fetchCarerSchedule] Bookings error:', bookingsError);
    throw bookingsError;
  }

  // Parse availability or use default
  const availability = staff?.availability || 'Full-time';
  const workingPattern = availability;
  
  // Create default schedule based on availability
  const defaultHours = availability === 'Full-time' 
    ? ['09:00-17:00'] 
    : availability === 'Part-time' 
    ? ['09:00-13:00'] 
    : ['On-call'];

  const availableHours = {
    monday: availability.includes('Monday') ? defaultHours : [],
    tuesday: availability.includes('Tuesday') ? defaultHours : [],
    wednesday: availability.includes('Wednesday') ? defaultHours : [],
    thursday: availability.includes('Thursday') ? defaultHours : [],
    friday: availability.includes('Friday') ? defaultHours : [],
    saturday: availability.includes('Saturday') ? defaultHours : [],
    sunday: availability.includes('Sunday') ? defaultHours : [],
  };

  // Calculate total hours per week
  const totalHoursPerWeek = Object.values(availableHours)
    .flat()
    .reduce((total, timeSlot) => {
      if (timeSlot.includes('-')) {
        const [start, end] = timeSlot.split('-');
        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        return total + (endHour - startHour);
      }
      return total;
    }, 0);

  // Get next shift info using the utility function
  const nextShift = upcomingBookings && upcomingBookings.length > 0 ? {
    date: new Date(upcomingBookings[0].start_time).toLocaleDateString(),
    time: new Date(upcomingBookings[0].start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    client: getClientName(upcomingBookings[0].clients)
  } : null;

  return {
    availableHours,
    workingPattern,
    totalHoursPerWeek,
    nextShift
  };
};

export const useCarerSchedule = (carerId: string) => {
  return useQuery({
    queryKey: ['carer-schedule', carerId],
    queryFn: () => fetchCarerSchedule(carerId),
    enabled: Boolean(carerId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
