import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from './useClientAuth';

export interface ClientScheduleData {
  careHours: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
  carePattern: string;
  totalHoursPerWeek: number;
  nextAppointment: {
    date: string;
    time: string;
    carer: string;
    service: string;
  } | null;
  careStatus: string;
}

const fetchClientSchedule = async (clientId: string): Promise<ClientScheduleData> => {
  console.log('[fetchClientSchedule] Fetching schedule for client:', clientId);
  
  // Get client's bookings for schedule analysis
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      start_time,
      end_time,
      status,
      staff (first_name, last_name),
      services (title)
    `)
    .eq('client_id', clientId)
    .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
    .order('start_time', { ascending: true });

  if (bookingsError) {
    console.error('[fetchClientSchedule] Bookings error:', bookingsError);
    throw bookingsError;
  }

  // Get upcoming appointments
  const { data: upcomingBookings, error: upcomingError } = await supabase
    .from('bookings')
    .select(`
      start_time,
      end_time,
      staff (first_name, last_name),
      services (title)
    `)
    .eq('client_id', clientId)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(1);

  if (upcomingError) {
    console.error('[fetchClientSchedule] Upcoming bookings error:', upcomingError);
    throw upcomingError;
  }

  // Get client status
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('status')
    .eq('id', clientId)
    .single();

  if (clientError) {
    console.error('[fetchClientSchedule] Client error:', clientError);
    throw clientError;
  }

  // Analyze care pattern from recent bookings
  const recentBookings = bookings || [];
  const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Initialize care hours structure
  const careHours = {
    monday: [] as string[],
    tuesday: [] as string[],
    wednesday: [] as string[],
    thursday: [] as string[],
    friday: [] as string[],
    saturday: [] as string[],
    sunday: [] as string[]
  };

  // Group bookings by day of week and extract time slots
  recentBookings.forEach(booking => {
    if (booking.status === 'completed' || booking.status === 'scheduled') {
      const bookingDate = new Date(booking.start_time);
      const dayName = weekDays[bookingDate.getDay()];
      const startTime = new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const timeSlot = `${startTime}-${endTime}`;
      
      if (careHours[dayName as keyof typeof careHours] && !careHours[dayName as keyof typeof careHours].includes(timeSlot)) {
        careHours[dayName as keyof typeof careHours].push(timeSlot);
      }
    }
  });

  // Calculate care pattern
  const daysWithCare = Object.values(careHours).filter(day => day.length > 0).length;
  let carePattern = 'No Regular Pattern';
  
  if (daysWithCare >= 7) {
    carePattern = 'Daily Care';
  } else if (daysWithCare >= 5) {
    carePattern = 'Weekday Care';
  } else if (daysWithCare >= 3) {
    carePattern = `${daysWithCare}x Weekly Care`;
  } else if (daysWithCare >= 1) {
    carePattern = 'Weekly Care';
  }

  // Calculate total hours per week
  const totalHoursPerWeek = Object.values(careHours)
    .flat()
    .reduce((total, timeSlot) => {
      if (timeSlot.includes('-')) {
        const [start, end] = timeSlot.split('-');
        const startTime = new Date(`2000-01-01 ${start}`);
        const endTime = new Date(`2000-01-01 ${end}`);
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);

  // Get next appointment info
  const nextAppointment = upcomingBookings && upcomingBookings.length > 0 ? {
    date: new Date(upcomingBookings[0].start_time).toLocaleDateString(),
    time: new Date(upcomingBookings[0].start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    carer: upcomingBookings[0].staff 
      ? `${upcomingBookings[0].staff.first_name} ${upcomingBookings[0].staff.last_name}`
      : 'Carer TBA',
    service: upcomingBookings[0].services?.title || 'Care Service'
  } : null;

  // Determine care status
  const careStatus = client?.status === 'active' ? 'Active' : 
                    client?.status === 'suspended' ? 'Suspended' : 'Pending';

  return {
    careHours,
    carePattern,
    totalHoursPerWeek,
    nextAppointment,
    careStatus
  };
};

export const useClientSchedule = (clientId?: string) => {
  const clientAuth = useClientAuth();
  
  // Use clientId from prop or from auth context
  const effectiveClientId = clientId || clientAuth.clientId;

  return useQuery({
    queryKey: ['client-schedule', effectiveClientId],
    queryFn: () => fetchClientSchedule(effectiveClientId!),
    enabled: Boolean(effectiveClientId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};