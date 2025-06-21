
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

// Hook to automatically generate notifications based on system events
export const useNotificationGenerator = (branchId?: string) => {
  const { data: userRole } = useUserRole();

  useEffect(() => {
    if (!userRole?.id) return;

    const generateNotifications = async () => {
      try {
        // Call the function to create overdue booking notifications
        await supabase.rpc('create_overdue_booking_notifications');

        // Generate medication reminder notifications
        const { data: upcomingMedications } = await supabase
          .from('client_medications')
          .select(`
            *,
            care_plan_id,
            client_care_plans!inner(
              client_id,
              clients!inner(
                first_name,
                last_name,
                branch_id
              )
            )
          `)
          .eq('status', 'active')
          .gte('start_date', new Date().toISOString().split('T')[0])
          .lte('start_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (upcomingMedications?.length) {
          for (const medication of upcomingMedications) {
            const client = medication.client_care_plans?.clients;
            if (client && (!branchId || client.branch_id === branchId)) {
              // Check if notification already exists
              const { data: existingNotification } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', userRole.id)
                .eq('type', 'medication')
                .eq('data->>medication_id', medication.id)
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .single();

              if (!existingNotification) {
                await supabase
                  .from('notifications')
                  .insert({
                    user_id: userRole.id,
                    branch_id: client.branch_id,
                    type: 'medication',
                    category: 'info',
                    priority: 'medium',
                    title: 'Medication Reminder',
                    message: `${medication.name} for ${client.first_name} ${client.last_name} is scheduled to start today`,
                    data: {
                      medication_id: medication.id,
                      client_name: `${client.first_name} ${client.last_name}`,
                      medication_name: medication.name
                    }
                  });
              }
            }
          }
        }

        // Generate appointment reminder notifications
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const { data: upcomingAppointments } = await supabase
          .from('client_appointments')
          .select(`
            *,
            clients!inner(
              first_name,
              last_name,
              branch_id
            )
          `)
          .eq('appointment_date', tomorrow.toISOString().split('T')[0])
          .eq('status', 'confirmed');

        if (upcomingAppointments?.length) {
          for (const appointment of upcomingAppointments) {
            const client = appointment.clients;
            if (client && (!branchId || client.branch_id === branchId)) {
              // Check if notification already exists
              const { data: existingNotification } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', userRole.id)
                .eq('type', 'appointment')
                .eq('data->>appointment_id', appointment.id)
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .single();

              if (!existingNotification) {
                await supabase
                  .from('notifications')
                  .insert({
                    user_id: userRole.id,
                    branch_id: client.branch_id,
                    type: 'appointment',
                    category: 'info',
                    priority: 'medium',
                    title: 'Upcoming Appointment',
                    message: `${client.first_name} ${client.last_name} has an appointment tomorrow at ${appointment.appointment_time}`,
                    data: {
                      appointment_id: appointment.id,
                      client_name: `${client.first_name} ${client.last_name}`,
                      appointment_time: appointment.appointment_time,
                      appointment_type: appointment.appointment_type
                    }
                  });
              }
            }
          }
        }

      } catch (error) {
        console.error('Error generating notifications:', error);
      }
    };

    // Generate notifications immediately
    generateNotifications();

    // Set up interval to generate notifications every 30 minutes
    const interval = setInterval(generateNotifications, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userRole?.id, branchId]);
};
