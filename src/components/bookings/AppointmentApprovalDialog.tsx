
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useApproveChangeRequest, useRejectChangeRequest } from "@/hooks/useBookingApprovalActions";

// Safe date formatter to prevent crashes on null/undefined dates
const formatDate = (date: string | null | undefined, formatStr: string): string => {
  if (!date) return "N/A";
  try {
    return format(new Date(date), formatStr);
  } catch {
    return "Invalid date";
  }
};

interface AppointmentApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  onApprove?: (appointmentId: string, adminNotes: string) => void;
  onReject?: (appointmentId: string, adminNotes: string) => void;
}

const AppointmentApprovalDialog: React.FC<AppointmentApprovalDialogProps> = ({
  open,
  onOpenChange,
  appointment,
  onApprove,
  onReject,
}) => {
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [adminNotes, setAdminNotes] = useState("");
  
  const approveRequestMutation = useApproveChangeRequest();
  const rejectRequestMutation = useRejectChangeRequest();

  const handleAction = async () => {
    if (!appointment) return;

    try {
      if (action === "approve") {
        await approveRequestMutation.mutateAsync({
          requestId: appointment.id,
          bookingId: appointment.booking_id,
          requestType: appointment.request_type,
          adminNotes,
          newDate: appointment.new_date,
          newTime: appointment.new_time
        });
        onApprove?.(appointment.id, adminNotes);
      } else {
        await rejectRequestMutation.mutateAsync({
          requestId: appointment.id,
          bookingId: appointment.booking_id,
          requestType: appointment.request_type,
          adminNotes
        });
        onReject?.(appointment.id, adminNotes);
      }
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error processing action:", error);
    }
  };

  const resetForm = () => {
    setAdminNotes("");
    setAction("approve");
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

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Cancellation Request</DialogTitle>
          <DialogDescription>
            Review the cancellation request and either approve or reject it.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex flex-col space-y-2 border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm">
                  {appointment.client_name?.split(" ").map((name: string) => name[0]).join("") || "?"}
                </div>
                <p className="text-sm font-medium">{appointment.client_name || "Unknown Client"}</p>
              </div>
              <Badge className={appointment.request_type === 'cancellation' ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}>
                {appointment.request_type === 'cancellation' ? 'Cancellation' : 'Reschedule'} Requested
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="flex items-center text-xs text-gray-600">
                <User className="h-3.5 w-3.5 mr-1.5" />
                <span>Staff: {appointment.staff_name || "N/A"}</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <User className="h-3.5 w-3.5 mr-1.5" />
                <span>Service: {appointment.service_title || "N/A"}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Request Details</Label>
            <div className="border rounded-md p-3">
              <div className="text-sm font-medium">Reason: {getCancellationReasonDisplay(appointment.reason || "")}</div>
              {appointment.notes && <div className="text-sm mt-1">{appointment.notes}</div>}
              {appointment.request_type === 'reschedule' && appointment.new_date && (
                <div className="text-sm mt-2 p-2 bg-blue-50 rounded">
                  <strong>Requested new time:</strong> {formatDate(appointment.new_date, "MMM d, yyyy")} at {appointment.new_time || "N/A"}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                Requested on {formatDate(appointment.created_at, "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          </div>
          
          <Tabs value={action} onValueChange={(value) => setAction(value as "approve" | "reject")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="approve" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">Approve</TabsTrigger>
              <TabsTrigger value="reject" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">Reject</TabsTrigger>
            </TabsList>
            <TabsContent value="approve" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Add any notes about this approval"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="h-24"
                />
                <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mt-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-blue-700">
                    Approving will mark this appointment as needing reallocation to another carer.
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="reject" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Rejection Reason (Required)</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Explain why this cancellation request is being rejected"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="h-24"
                />
                <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-xs text-amber-700">
                    The carer will be notified that their cancellation request has been rejected and they are still responsible for this appointment.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAction}
            disabled={(action === "reject" && !adminNotes) || approveRequestMutation.isPending || rejectRequestMutation.isPending}
            className={action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
          >
            {approveRequestMutation.isPending || rejectRequestMutation.isPending ? "Processing..." : (
              action === "approve" ? `Approve ${appointment.request_type === 'cancellation' ? 'Cancellation' : 'Reschedule'}` : `Reject ${appointment.request_type === 'cancellation' ? 'Cancellation' : 'Reschedule'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentApprovalDialog;
