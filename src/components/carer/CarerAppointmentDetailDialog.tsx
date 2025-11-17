import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, MapPin, Phone, Mail, FileText, Activity, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface CarerAppointmentDetailDialogProps {
  appointment: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartVisit?: (appointment: any) => void;
  onContinueVisit?: (appointment: any) => void;
  onViewSummary?: (appointment: any) => void;
  onRequestUnavailability?: (appointment: any) => void;
}

export const CarerAppointmentDetailDialog = ({
  appointment,
  open,
  onOpenChange,
  onStartVisit,
  onContinueVisit,
  onViewSummary,
  onRequestUnavailability
}: CarerAppointmentDetailDialogProps) => {
  if (!appointment) return null;

  // Helper to normalize status for display and logic
  const normalizeStatus = (status: string) => {
    return status === 'in_progress' ? 'in-progress' : status;
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus?.toLowerCase()) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canStartAppointment = (appointment: any) => {
    if (!appointment) return false;
    
    const now = new Date();
    const startTime = new Date(appointment.start_time);
    const timeDiff = (now.getTime() - startTime.getTime()) / (1000 * 60);
    
    return appointment.status === 'assigned' && timeDiff >= -15;
  };

  const handleStartVisit = () => {
    onStartVisit?.(appointment);
    onOpenChange(false);
  };

  const handleContinueVisit = () => {
    onContinueVisit?.(appointment);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Appointment Details</span>
            <Badge className={getStatusColor(appointment.status)}>
              {normalizeStatus(appointment.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(appointment.start_time), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Client Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </h3>
            <div className="space-y-2">
              <p className="font-medium">
                {appointment.clients?.first_name} {appointment.clients?.last_name}
              </p>
              {appointment.clients?.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{appointment.clients.email}</span>
                </div>
              )}
              {appointment.clients?.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{appointment.clients.phone}</span>
                </div>
              )}
              {appointment.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>{appointment.address}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Service Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Service Details
            </h3>
            <div className="space-y-2">
              <p className="font-medium">{appointment.services?.title || 'No service specified'}</p>
              {appointment.services?.description && (
                <p className="text-sm text-muted-foreground">{appointment.services.description}</p>
              )}
              {appointment.revenue && (
                <p className="text-sm text-muted-foreground">
                  Revenue: £{appointment.revenue}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {appointment.notes}
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <Separator />
          <div className="flex flex-col gap-3">
            {appointment.status === 'completed' && (
              <Button onClick={() => {
                if (onViewSummary) {
                  onViewSummary(appointment);
                } else {
                  // Fallback to direct navigation
                  window.location.href = `/carer-dashboard/visit/${appointment.id}?mode=view`;
                }
                onOpenChange(false);
              }} className="flex-1 bg-green-600 hover:bg-green-700">
                View Summary
              </Button>
            )}
            {(appointment.status === 'in-progress' || appointment.status === 'in_progress') && (
              <Button onClick={handleContinueVisit} className="flex-1">
                Continue Visit
              </Button>
            )}
            {canStartAppointment(appointment) && appointment.status === 'assigned' && (
              <Button onClick={handleStartVisit} className="flex-1">
                Start Visit
              </Button>
            )}
            
            {/* Not Available Button - Only show for future assigned bookings */}
            {appointment.status === 'assigned' && new Date(appointment.start_time) > new Date() && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  onRequestUnavailability?.(appointment);
                  onOpenChange(false);
                }}
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                I'm Not Available
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};