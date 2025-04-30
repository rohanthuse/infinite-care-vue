
import React from "react";
import { format } from "date-fns";
import { Calendar, Clock, User, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Appointment {
  date: Date;
  action: string;
  performer: string;
  status: string;
  location?: string;
  duration?: string;
}

interface AppointmentsTabProps {
  clientId: string;
  appointments?: Appointment[];
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ clientId, appointments = [] }) => {
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Client Appointments</CardTitle>
            </div>
            <Button size="sm" className="gap-1">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Schedule</span>
            </Button>
          </div>
          <CardDescription>Appointments for client {clientId}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No appointments scheduled for this client</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 hover:shadow-sm transition-all duration-300 bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{appointment.action}</h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <User className="h-3 w-3 mr-1" />
                        <span className="mr-3">{appointment.performer}</span>
                        {appointment.location && (
                          <>
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{appointment.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center mt-3 text-sm text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className="mr-3">{format(appointment.date, 'MMMM d, yyyy')}</span>
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{format(appointment.date, 'h:mm a')}</span>
                    {appointment.duration && <span className="ml-2">• {appointment.duration}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
