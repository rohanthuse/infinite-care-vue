
import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Plus, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduleAppointmentDialog } from "../dialogs/ScheduleAppointmentDialog";
import { useClientAppointments } from "@/hooks/useClientData";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AppointmentsTabProps {
  clientId: string;
  appointments?: any[];
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ clientId }) => {
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const { data: appointments = [], isLoading } = useClientAppointments(clientId);
  const queryClient = useQueryClient();

  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const { data, error } = await supabase
        .from('client_appointments')
        .insert([{
          client_id: clientId,
          ...appointmentData,
          appointment_date: appointmentData.appointment_date.toISOString().split('T')[0],
          status: 'confirmed'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-appointments', clientId] });
    },
  });

  const handleScheduleAppointment = async (appointmentData: any) => {
    await createAppointmentMutation.mutateAsync(appointmentData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Appointments</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={() => setIsScheduleDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Schedule</span>
            </Button>
          </div>
          <CardDescription>Scheduled appointments for client {clientId}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No appointments scheduled for this client</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{appointment.appointment_type}</h3>
                        <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.appointment_time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{appointment.provider_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{appointment.location}</span>
                        </div>
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleAppointmentDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        onSave={handleScheduleAppointment}
      />
    </div>
  );
};
