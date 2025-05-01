
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { RescheduleAppointmentDialog } from "@/components/client/RescheduleAppointmentDialog";
import { RequestAppointmentDialog } from "@/components/client/RequestAppointmentDialog";

const ClientAppointments = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  // Mock appointment data
  const upcomingAppointments = [
    {
      id: 1,
      type: "Therapy Session",
      provider: "Dr. Smith, Physical Therapist",
      date: "May 3, 2025",
      time: "10:00 AM",
      location: "Main Clinic, Room 204",
      status: "confirmed"
    },
    {
      id: 2,
      type: "Weekly Check-in",
      provider: "Nurse Johnson",
      date: "May 10, 2025",
      time: "2:00 PM",
      location: "Video Call",
      status: "confirmed"
    },
    {
      id: 3,
      type: "Specialist Consultation",
      provider: "Dr. Williams, Neurologist",
      date: "May 17, 2025",
      time: "11:30 AM",
      location: "Neurology Department, Floor 3",
      status: "pending"
    }
  ];

  const pastAppointments = [
    {
      id: 101,
      type: "Therapy Session",
      provider: "Dr. Smith, Physical Therapist",
      date: "April 19, 2025",
      time: "10:00 AM",
      location: "Main Clinic, Room 204",
      status: "completed"
    },
    {
      id: 102,
      type: "Weekly Check-in",
      provider: "Nurse Johnson",
      date: "April 12, 2025",
      time: "2:00 PM",
      location: "Video Call",
      status: "completed"
    },
    {
      id: 103,
      type: "Initial Assessment",
      provider: "Dr. Williams, Neurologist",
      date: "April 5, 2025",
      time: "11:30 AM",
      location: "Neurology Department, Floor 3",
      status: "cancelled"
    }
  ];

  // Open reschedule dialog
  const handleReschedule = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsRescheduling(true);
  };

  // Open request appointment dialog
  const handleRequestAppointment = () => {
    setIsRequesting(true);
  };

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Render appointment card
  const renderAppointmentCard = (appointment: any) => (
    <Card key={appointment.id} className="mb-4">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="space-y-3">
            <div className="flex items-center justify-between md:justify-start">
              <h3 className="text-lg font-bold">{appointment.type}</h3>
              <span className={`text-xs font-medium px-2 py-1 rounded-full md:ml-3 ${getStatusBadge(appointment.status)}`}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 flex items-center">
              <User className="h-4 w-4 mr-2" />
              {appointment.provider}
            </div>
            
            <div className="text-sm text-gray-600 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {appointment.date} • <Clock className="h-4 w-4 mx-2" /> {appointment.time}
            </div>
            
            <div className="text-sm text-gray-600 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {appointment.location}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            {appointment.status === "confirmed" || appointment.status === "pending" ? (
              <>
                <Button variant="outline" size="sm" onClick={() => handleReschedule(appointment)}>Reschedule</Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">Cancel</Button>
              </>
            ) : appointment.status === "completed" ? (
              <Button size="sm">View Summary</Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-6">Your Appointments</h2>
        
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            <Button onClick={handleRequestAppointment}>Request Appointment</Button>
          </div>
          
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(renderAppointmentCard)
            ) : (
              <div className="text-center p-8">
                <p className="text-gray-500">No upcoming appointments.</p>
                <Button className="mt-4" onClick={handleRequestAppointment}>Schedule New Appointment</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4">
            {pastAppointments.length > 0 ? (
              pastAppointments.map(renderAppointmentCard)
            ) : (
              <div className="text-center p-8">
                <p className="text-gray-500">No past appointment records.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reschedule Appointment Dialog */}
      {selectedAppointment && (
        <RescheduleAppointmentDialog
          open={isRescheduling}
          onOpenChange={setIsRescheduling}
          appointment={selectedAppointment}
        />
      )}

      {/* Request Appointment Dialog */}
      <RequestAppointmentDialog
        open={isRequesting}
        onOpenChange={setIsRequesting}
      />
    </div>
  );
};

export default ClientAppointments;
