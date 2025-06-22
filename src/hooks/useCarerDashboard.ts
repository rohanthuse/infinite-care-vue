
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCarerAuth } from "./useCarerAuth";
import { useCarerBranch } from "./useCarerBranch";
import { format, startOfWeek, endOfWeek, isToday, isTomorrow } from "date-fns";

export const useCarerDashboard = () => {
  const { user } = useCarerAuth();
  const { data: carerBranch } = useCarerBranch();

  // Get today's appointments/bookings
  const { data: todayAppointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['carer-appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients(first_name, last_name),
          services(title)
        `)
        .eq('staff_id', user.id)
        .gte('start_time', `${today}T00:00:00`)
        .lt('start_time', `${today}T23:59:59`)
        .order('start_time');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get upcoming appointments (next 7 days)
  const { data: upcomingAppointments = [], isLoading: upcomingLoading } = useQuery({
    queryKey: ['carer-upcoming-appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients(first_name, last_name),
          services(title)
        `)
        .eq('staff_id', user.id)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${nextWeek}T23:59:59`)
        .order('start_time')
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get carer's tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['carer-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:staff(first_name, last_name),
          client:clients(first_name, last_name)
        `)
        .eq('assignee_id', user.id)
        .neq('status', 'done')
        .order('due_date')
        .limit(5);

      if (error) {
        console.error('Tasks query error:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get client count for the branch
  const { data: clientCount = 0, isLoading: clientCountLoading } = useQuery({
    queryKey: ['branch-client-count', carerBranch?.branch_id],
    queryFn: async () => {
      if (!carerBranch?.branch_id) return 0;
      
      const { count, error } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', carerBranch.branch_id)
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!carerBranch?.branch_id,
  });

  // Get work hours for current week
  const { data: weeklyHours = 0, isLoading: hoursLoading } = useQuery({
    queryKey: ['carer-weekly-hours', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('hours_worked')
        .eq('person_id', user.id)
        .gte('attendance_date', weekStart)
        .lte('attendance_date', weekEnd);

      if (error) throw error;
      
      const totalHours = data?.reduce((sum, record) => sum + (record.hours_worked || 0), 0) || 0;
      return Math.round(totalHours * 100) / 100;
    },
    enabled: !!user?.id,
  });

  // Transform appointments for display
  const formattedAppointments = upcomingAppointments.map(appointment => ({
    id: appointment.id,
    time: format(new Date(appointment.start_time), 'HH:mm'),
    client: `${appointment.clients?.first_name || ''} ${appointment.clients?.last_name || ''}`.trim(),
    service: appointment.services?.title || 'Service',
    status: appointment.status || 'scheduled',
    isToday: isToday(new Date(appointment.start_time)),
    isTomorrow: isTomorrow(new Date(appointment.start_time)),
    date: format(new Date(appointment.start_time), 'MMM dd'),
  }));

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

  const isLoading = appointmentsLoading || upcomingLoading || tasksLoading || clientCountLoading || hoursLoading;

  return {
    todayAppointments,
    upcomingAppointments: formattedAppointments,
    tasks: formattedTasks,
    clientCount,
    weeklyHours,
    isLoading,
    user,
    carerBranch,
  };
};
