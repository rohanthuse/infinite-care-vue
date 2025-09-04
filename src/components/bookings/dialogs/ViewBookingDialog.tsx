import React from "react";
import { format, parseISO } from "date-fns";
import { Eye, Clock, User, Calendar, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDeleteBooking } from "@/data/hooks/useDeleteBooking";
import { useUserRole } from "@/hooks/useUserRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ViewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  services: Array<{ id: string; title: string }>;
  onEdit?: () => void;
  branchId?: string;
}

export function ViewBookingDialog({
  open,
  onOpenChange,
  booking,
  services,
  onEdit,
  branchId,
}: ViewBookingDialogProps) {
  const deleteBooking = useDeleteBooking(branchId);
  const { data: userRole } = useUserRole();
  if (!booking) return null;

  const service = services.find((s) => s.id === booking.service_id);
  
  // Construct proper Date objects from booking date and time strings
  const startTime = new Date(`${booking.date}T${booking.startTime}:00`);
  const endTime = new Date(`${booking.date}T${booking.endTime}:00`);
  
  // Check if user can delete bookings (admins only)
  const canDelete = userRole?.role && ['super_admin', 'branch_admin'].includes(userRole.role);
  
  // Determine if the appointment has already started
  const hasStarted = booking && new Date(`${booking.date}T${booking.startTime}`) <= new Date();

  const handleDelete = async () => {
    if (!booking) return;
    
    try {
      await deleteBooking.mutateAsync({
        bookingId: booking.id,
        clientId: booking.clientId,
        staffId: booking.carerId,
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Eye className="h-5 w-5" />
            View Appointment
          </DialogTitle>
          <DialogDescription>
            Appointment details and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Status</span>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          {/* Client Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4" />
              Client Information
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Client:</span>
                <span className="text-sm font-medium">{booking.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Assigned Carer:</span>
                <span className="text-sm font-medium">{booking.carerName}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Schedule Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="h-4 w-4" />
              Schedule
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm font-medium">
                  {format(startTime, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Start Time:</span>
                <span className="text-sm font-medium">
                  {format(startTime, "h:mm a")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">End Time:</span>
                <span className="text-sm font-medium">
                  {format(endTime, "h:mm a")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="text-sm font-medium">
                  {Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))} minutes
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Service Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4" />
              Service
            </div>
            <div className="pl-6">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Service:</span>
                <span className="text-sm font-medium">
                  {service?.title || "No service selected"}
                </span>
              </div>
            </div>
          </div>

          {booking.notes && (
            <>
              <Separator />
              
              {/* Additional Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="h-4 w-4" />
                  Additional Information
                </div>
                <div className="pl-6">
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600">Notes:</span>
                    <div className="text-sm font-medium whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-md">
                      {booking.notes}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Booking Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="h-4 w-4" />
              Booking Details
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Booking ID:</span>
                <span className="text-sm font-medium font-mono">{booking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm font-medium">{booking.date}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {canDelete && !hasStarted && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="destructive" 
                      disabled={deleteBooking.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Booking
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this booking? This action cannot be undone.
                        The booking will be permanently removed from the system.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteBooking.isPending ? "Deleting..." : "Delete Booking"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {onEdit && (
                <Button type="button" onClick={onEdit}>
                  Edit Appointment
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}