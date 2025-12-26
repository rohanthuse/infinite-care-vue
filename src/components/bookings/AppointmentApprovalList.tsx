
import React, { useState } from "react";
import { Calendar, Clock, MapPin, User, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import AppointmentApprovalDialog from "./AppointmentApprovalDialog";
import ReallocateAppointmentDialog from "./ReallocateAppointmentDialog";
import { toast } from "sonner";
import { useFetchPendingRequests } from "@/hooks/useBookingApprovalActions";
import { Skeleton } from "@/components/ui/skeleton";

// Safe date formatter to prevent crashes on null/undefined dates
const formatDate = (date: string | null | undefined, formatStr: string): string => {
  if (!date) return "N/A";
  try {
    return format(new Date(date), formatStr);
  } catch {
    return "Invalid date";
  }
};

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

const AppointmentApprovalList: React.FC<{ branchId?: string }> = ({ branchId }) => {
  const { data: pendingRequests, isLoading } = useFetchPendingRequests(branchId);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showReallocationDialog, setShowReallocationDialog] = useState(false);
  
  // Helper functions to construct client name from first_name and last_name
  const getClientFullName = (client: any) => {
    if (!client) return "Unknown Client";
    const firstName = client.first_name || "";
    const lastName = client.last_name || "";
    return `${firstName} ${lastName}`.trim() || "Unknown Client";
  };

  const getClientInitials = (client: any) => {
    if (!client) return "?";
    const firstName = client.first_name || "";
    const lastName = client.last_name || "";
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return initials || "?";
  };
  
  const handleReallocate = (appointmentId: string, newCarerId: string) => {
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const pendingCancellations = pendingRequests?.filter(r => r.request_type === 'cancellation') || [];
  const pendingReschedules = pendingRequests?.filter(r => r.request_type === 'reschedule') || [];
  const totalPending = pendingRequests?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Pending Change Requests</h2>
          <p className="text-sm text-muted-foreground mt-1">Review and manage appointment change requests</p>
        </div>
        <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
          {totalPending} Pending
        </Badge>
      </div>

      {totalPending > 0 ? (
        <div className="space-y-4">
          {pendingRequests?.map((request: any) => {
            const booking = request.bookings;
            const client = booking?.clients;
            const staff = booking?.staff;
            const service = booking?.services;
            
            return (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center font-medium">
                        {getClientInitials(client)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{getClientFullName(client)}</h3>
                          <Badge className={request.request_type === 'cancellation' ? "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300" : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"}>
                            {request.request_type === 'cancellation' ? 'Cancellation' : 'Reschedule'} Requested
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Service: {service?.title || "N/A"} | Assigned to: {staff ? `${staff.first_name} ${staff.last_name}` : "N/A"}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                            <span>{formatDate(booking?.start_time, "EEE, MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                            <span>{formatDate(booking?.start_time, "HH:mm")}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-2 bg-muted rounded-md border">
                          <div className="text-xs font-medium">
                            Reason: {getCancellationReasonDisplay(request.reason || "")}
                          </div>
                          {request.notes && <div className="text-xs mt-1">{request.notes}</div>}
                          {request.request_type === 'reschedule' && request.new_date && (
                            <div className="text-xs mt-1 font-medium text-blue-600 dark:text-blue-400">
                              New Date/Time: {formatDate(request.new_date, "MMM d, yyyy")} at {request.new_time || "N/A"}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            Requested {formatDate(request.created_at, "MMM d, yyyy 'at' h:mm a")}
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
                        if (!booking?.id) {
                          toast.error("Cannot process request", {
                            description: "Booking data is missing or incomplete"
                          });
                          return;
                        }
                        setSelectedAppointment({
                          ...request,
                          booking_id: booking.id,
                          client_name: getClientFullName(client),
                          staff_name: staff ? `${staff.first_name} ${staff.last_name}` : "N/A",
                          service_title: service?.title
                        });
                        setShowApprovalDialog(true);
                      }}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/50"
                      onClick={() => {
                        if (!booking?.id) {
                          toast.error("Cannot process request", {
                            description: "Booking data is missing or incomplete"
                          });
                          return;
                        }
                        setSelectedAppointment({
                          ...request,
                          booking_id: booking.id,
                          client_name: getClientFullName(client),
                          staff_name: staff ? `${staff.first_name} ${staff.last_name}` : "N/A",
                          service_title: service?.title
                        });
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
          );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Check className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No pending requests</h3>
            <p className="text-muted-foreground max-w-sm mt-1">
              There are currently no cancellation requests waiting for approval.
            </p>
          </CardContent>
        </Card>
      )}
      
      {selectedAppointment && showApprovalDialog && (
        <AppointmentApprovalDialog
          open={showApprovalDialog}
          onOpenChange={(open) => {
            setShowApprovalDialog(open);
            if (!open) setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
        />
      )}
      
      {selectedAppointment && showReallocationDialog && (
        <ReallocateAppointmentDialog
          open={showReallocationDialog}
          onOpenChange={(open) => {
            setShowReallocationDialog(open);
            if (!open) setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onReallocate={handleReallocate}
        />
      )}
    </div>
  );
};

export default AppointmentApprovalList;
