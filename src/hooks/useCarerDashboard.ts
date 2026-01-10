
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCarerContext } from "./useCarerContext";
import { format, startOfWeek, endOfWeek, isToday, isTomorrow, differenceInMinutes } from "date-fns";
import { getClientPostcodeWithFallback, getClientDisplayAddress } from "@/utils/postcodeUtils";

export const useCarerDashboard = () => {
  const { data: carerContext, isLoading: contextLoading } = useCarerContext();

  // Get today's appointments/bookings
  const { data: todayAppointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['carer-appointments', carerContext?.staffId],
    queryFn: async () => {
      if (!carerContext?.staffId) return [];
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients(id, first_name, last_name, phone, address, pin_code, client_addresses(*)),
          services(title, description)
        `)
        .eq('staff_id', carerContext.staffId)
        .gte('start_time', `${today}T00:00:00`)
        .lt('start_time', `${today}T23:59:59`)
        .order('start_time');

      if (error) throw error;
      return data || [];
    },
    enabled: !!carerContext?.staffId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Get upcoming appointments (next 7 days)
  const { data: upcomingAppointments = [], isLoading: upcomingLoading } = useQuery({
    queryKey: ['carer-upcoming-appointments', carerContext?.staffId],
    queryFn: async () => {
      if (!carerContext?.staffId) return [];
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients(id, first_name, last_name, phone, address, pin_code, client_addresses(*)),
          services(title)
        `)
        .eq('staff_id', carerContext.staffId)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${nextWeek}T23:59:59`)
        .order('start_time')
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!carerContext?.staffId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Get carer's tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['carer-tasks', carerContext?.staffId],
    queryFn: async () => {
      if (!carerContext?.staffId) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:staff(first_name, last_name),
          client:clients(first_name, last_name)
        `)
        .eq('assignee_id', carerContext.staffId)
        .neq('status', 'done')
        .order('due_date')
        .limit(5);

      if (error) {
        console.error('Tasks query error:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!carerContext?.staffId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
  });

  // Get client count for the branch
  const { data: clientCount = 0, isLoading: clientCountLoading } = useQuery({
    queryKey: ['branch-client-count', carerContext?.branchInfo?.id],
    queryFn: async () => {
      if (!carerContext?.branchInfo?.id) return 0;
      
      const { count, error } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', carerContext.branchInfo.id)
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!carerContext?.branchInfo?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - client count changes rarely
    refetchOnWindowFocus: false,
  });

  // Get work hours for current week
  const { data: weeklyHours = 0, isLoading: hoursLoading } = useQuery({
    queryKey: ['carer-weekly-hours', carerContext?.staffId],
    queryFn: async () => {
      if (!carerContext?.staffId) return 0;
      
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('hours_worked')
        .eq('person_id', carerContext.staffId)
        .gte('attendance_date', weekStart)
        .lte('attendance_date', weekEnd);

      if (error) throw error;
      
      const totalHours = data?.reduce((sum, record) => sum + (record.hours_worked || 0), 0) || 0;
      return Math.round(totalHours * 100) / 100;
    },
    enabled: !!carerContext?.staffId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Get improvement areas for the carer
  const { data: improvementAreas = [], isLoading: improvementAreasLoading, error: improvementAreasError } = useQuery({
    queryKey: ['carer-improvement-areas', carerContext?.staffId],
    queryFn: async () => {
      if (!carerContext?.staffId) {
        console.warn('[useCarerDashboard] Cannot fetch improvement areas - staffId not available');
        return [];
      }
      
      console.log('[useCarerDashboard] Fetching improvement areas for staffId:', carerContext.staffId);
      
      const { data, error } = await supabase
        .from('staff_improvement_areas')
        .select('*')
        .eq('staff_id', carerContext.staffId)
        .in('status', ['open', 'in_progress'])
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('[useCarerDashboard] Improvement areas query error:', error);
        console.error('[useCarerDashboard] Query details:', {
          staffId: carerContext.staffId,
          status: ['open', 'in_progress'],
        });
        throw error;
      }
      
      console.log('[useCarerDashboard] Improvement areas fetched:', data?.length || 0, 'records');
      console.log('[useCarerDashboard] Improvement areas data:', data);
      
      return data || [];
    },
    enabled: !!carerContext?.staffId,
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // Check if appointment can be started
  const canStartAppointment = (appointment: any) => {
    const now = new Date();
    const startTime = new Date(appointment.start_time);
    const appointmentDate = format(startTime, 'yyyy-MM-dd');
    const todayDate = format(now, 'yyyy-MM-dd');
    
    // Exclude completed/done/cancelled appointments
    const excludedStatuses = ['completed', 'done', 'cancelled'];
    if (excludedStatuses.includes(appointment.status)) {
      return false;
    }
    
    const isToday = appointmentDate === todayDate;
    const minutesDiff = differenceInMinutes(startTime, now);
    
    return (
      (appointment.status === 'assigned' || appointment.status === 'scheduled' || appointment.status === 'confirmed') &&
      (isToday || (minutesDiff <= 240 && minutesDiff >= -240))
    );
  };

  // Get ready to start appointments (today's appointments that can be started)
  const readyToStartAppointments = todayAppointments.filter(canStartAppointment);

  // Transform appointments for display
  const formattedAppointments = upcomingAppointments.map(appointment => {
    const clientAddress = getClientDisplayAddress(
      appointment.clients?.client_addresses,
      appointment.clients?.address
    );
    const clientPostcode = getClientPostcodeWithFallback(
      appointment.clients?.client_addresses,
      appointment.clients?.pin_code,
      appointment.clients?.address
    );
    
    return {
      id: appointment.id,
      time: format(new Date(appointment.start_time), 'HH:mm'),
      client: `${appointment.clients?.first_name || ''} ${appointment.clients?.last_name || ''}`.trim(),
      service: appointment.services?.title || 'Service',
      status: appointment.status || 'scheduled',
      isToday: isToday(new Date(appointment.start_time)),
      isTomorrow: isTomorrow(new Date(appointment.start_time)),
      date: format(new Date(appointment.start_time), 'MMM dd'),
      address: clientAddress,
      postcode: clientPostcode,
    };
  });

  // Transform tasks for display
  const formattedTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    priority: task.priority,
    dueDate: task.due_date ? format(new Date(task.due_date), 'MMM dd') : null,
    client: task.client ? `${task.client.first_name} ${task.client.last_name}` : null,
    status: task.status,
    category: task.category || 'General',
  }));

  const isLoading = contextLoading || appointmentsLoading || upcomingLoading || tasksLoading || clientCountLoading || hoursLoading || improvementAreasLoading;

  return {
    todayAppointments,
    readyToStartAppointments,
    upcomingAppointments: formattedAppointments,
    tasks: formattedTasks,
    clientCount,
    weeklyHours,
    improvementAreas,
    improvementAreasError,
    isLoading,
    // New unified context
    carerContext,
    // Backward compatibility
    user: carerContext?.staffProfile ? { id: carerContext.staffProfile.auth_user_id } : null,
    carerBranch: carerContext?.branchInfo ? { 
      ...carerContext.staffProfile,
      branch_id: carerContext.branchInfo.id,
      branches: carerContext.branchInfo
    } : null,
  };
};
