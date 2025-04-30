
import React, { useState } from "react";
import { Calendar, Clock, MapPin, User, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import AppointmentApprovalDialog from "./AppointmentApprovalDialog";
import ReallocateAppointmentDialog from "./ReallocateAppointmentDialog";
import { toast } from "sonner";

interface Appointment {
  id: string;
  clientName: string;
  carerName: string;
  date: Date;
  time: string;
  location: string;
  type: string;
  status: string;
  cancellationReason?: string;
  cancellationNotes?: string;
  requestDate?: Date;
}

// Mock data
const mockPendingCancellations: Appointment[] = [
  {
    id: "1",
    clientName: "Emma Thompson",
    carerName: "Sarah Johnson",
    date: new Date(),
    time: "10:30 AM - 11:30 AM",
    location: "15 Oak Street, Milton Keynes",
    type: "Home Care Visit",
    status: "pending_cancellation",
    cancellationReason: "illness",
    cancellationNotes: "I'm feeling unwell and don't want to risk spreading infection",
    requestDate: new Date(new Date().setHours(new Date().getHours() - 3))
  },
  {
    id: "2",
    clientName: "Robert Johnson",
    carerName: "Michael Wilson",
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    time: "2:00 PM - 3:00 PM",
    location: "42 Pine Avenue, Milton Keynes",
    type: "Follow-up Visit",
    status: "pending_cancellation",
    cancellationReason: "transport_issue",
    cancellationNotes: "My car broke down and I can't find alternative transportation",
    requestDate: new Date(new Date().setHours(new Date().getHours() - 1))
  },
  {
    id: "3",
    clientName: "Margaret Brown",
    carerName: "Elizabeth Davis",
    date: new Date(new Date().setDate(new Date().getDate() + 2)),
    time: "4:00 PM - 5:00 PM",
    location: "8 Cedar Lane, Milton Keynes",
    type: "Home Care Visit",
    status: "pending_cancellation",
    cancellationReason: "scheduling_conflict",
    cancellationNotes: "I have a doctor's appointment at this time",
    requestDate: new Date(new Date().setHours(new Date().getHours() - 5))
  }
];

const AppointmentApprovalList: React.FC = () => {
  const [pendingCancellations, setPendingCancellations] = useState<Appointment[]>(mockPendingCancellations);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showReallocationDialog, setShowReallocationDialog] = useState(false);
  
  const handleApprove = (appointmentId: string, adminNotes: string) => {
    // In a real app, this would call an API
    setPendingCancellations(prev => prev.filter(app => app.id !== appointmentId));
    toast.success("Cancellation approved", {
      description: "The appointment has been marked for reallocation"
    });
    setShowApprovalDialog(false);
    setShowReallocationDialog(true);
  };
  
  const handleReject = (appointmentId: string, adminNotes: string) => {
    // In a real app, this would call an API
    setPendingCancellations(prev => prev.filter(app => app.id !== appointmentId));
    toast.success("Cancellation rejected", {
      description: "The carer has been notified"
    });
    setShowApprovalDialog(false);
  };
  
  const handleReallocate = (appointmentId: string, newCarerId: string) => {
    // In a real app, this would call an API
    toast.success("Appointment reallocated successfully", {
      description: "Both carers have been notified of the change"
    });
    setShowReallocationDialog(false);
    setSelectedAppointment(null);
  };

  const getCancellationReasonDisplay = (reason: string) => {
    switch (reason) {
      case "illness": return "Carer Illness";
      case "emergency": return "Personal Emergency";
      case "scheduling_conflict": return "Scheduling Conflict";
      case "transport_issue": return "Transportation Issue";
      case "other": return "Other Reason";
      default: return reason;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Pending Cancellation Requests</h2>
          <p className="text-sm text-gray-500 mt-1">Review and manage appointment cancellation requests</p>
        </div>
        <Badge variant="outline" className="bg-purple-100 text-purple-800">
          {pendingCancellations.length} Pending
        </Badge>
      </div>

      {pendingCancellations.length > 0 ? (
        <div className="space-y-4">
          {pendingCancellations.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                        {appointment.clientName.split(" ").map(name => name[0]).join("")}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{appointment.clientName}</h3>
                          <Badge className="bg-purple-100 text-purple-800">
                            Cancellation Requested
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">Assigned to: {appointment.carerName}</div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                            <span>{format(appointment.date, "EEE, MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                            <span>{appointment.time}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-3.5 w-3.5 mr-1.5" />
                            <span>{appointment.location}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-3.5 w-3.5 mr-1.5" />
                            <span>{appointment.type}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-2 bg-gray-50 rounded-md border">
                          <div className="text-xs font-medium">
                            Reason: {getCancellationReasonDisplay(appointment.cancellationReason || "")}
                          </div>
                          <div className="text-xs mt-1">{appointment.cancellationNotes}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Requested {format(appointment.requestDate || new Date(), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowApprovalDialog(true);
                      }}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowApprovalDialog(true);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Check className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No pending requests</h3>
            <p className="text-gray-500 max-w-sm mt-1">
              There are currently no cancellation requests waiting for approval.
            </p>
          </CardContent>
        </Card>
      )}
      
      {selectedAppointment && (
        <>
          <AppointmentApprovalDialog
            open={showApprovalDialog}
            onOpenChange={setShowApprovalDialog}
            appointment={selectedAppointment}
            onApprove={handleApprove}
            onReject={handleReject}
          />
          
          <ReallocateAppointmentDialog
            open={showReallocationDialog}
            onOpenChange={setShowReallocationDialog}
            appointment={selectedAppointment}
            onReallocate={handleReallocate}
          />
        </>
      )}
    </div>
  );
};

export default AppointmentApprovalList;
