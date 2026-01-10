import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, MapPin, Phone, Mail, FileText, Activity, AlertCircle, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { CarePlanPreviewSection } from "@/components/care/CarePlanPreviewSection";
import { getClientPostcodeWithFallback, getClientDisplayAddress } from "@/utils/postcodeUtils";

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
        return 'bg-blue-600 text-white border-blue-700';
      case 'in-progress':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const canStartAppointment = (appointment: any) => {
    if (!appointment) return false;
    
    const now = new Date();
    const startTime = new Date(appointment.start_time);
    const timeDiff = (now.getTime() - startTime.getTime()) / (1000 * 60);
    
    return appointment.status === 'assigned' && timeDiff >= -15;
  };

  const getUnavailabilityStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Unavailability Requested',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800'
        };
      case 'approved':
        return {
          label: 'Unavailability Approved',
          className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800'
        };
      case 'rejected':
        return {
          label: 'Unavailability Rejected',
          className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800'
        };
      case 'reassigned':
        return {
          label: 'Booking Reassigned',
          className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800'
        };
      default:
        return null;
    }
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
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Appointment Details</span>
            <Badge variant="custom" className={getStatusColor(appointment.status)}>
              {normalizeStatus(appointment.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base">Date</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {format(new Date(appointment.start_time), 'EEE, MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base">Time</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
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
              {(() => {
                const clientAddress = getClientDisplayAddress(
                  appointment.clients?.client_addresses,
                  appointment.clients?.address || appointment.address
                );
                const clientPostcode = getClientPostcodeWithFallback(
                  appointment.clients?.client_addresses,
                  appointment.clients?.pin_code,
                  appointment.clients?.address || appointment.address
                );
                
                return (clientAddress || clientPostcode) ? (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col">
                      {clientAddress && <span>{clientAddress}</span>}
                      {clientPostcode && (
                        <span className="font-medium text-foreground/80">
                          Postcode: {clientPostcode}
                        </span>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}
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
              {/* Multiple Services Display */}
              {appointment.service_names && appointment.service_names.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {appointment.service_names.map((serviceName: string, idx: number) => (
                    <Badge key={idx} variant="custom" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800">
                      {serviceName}
                    </Badge>
                  ))}
                </div>
              ) : appointment.services?.title ? (
                <Badge variant="custom" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800">
                  {appointment.services.title}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">No service specified</p>
              )}
              {appointment.services?.description && (
                <p className="text-sm text-muted-foreground mt-2">{appointment.services.description}</p>
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

          {/* Care Plan Preview Section */}
          {(appointment.client_id || appointment.clients?.id) && (
            <>
              <Separator />
              <div className="bg-muted/30 rounded-lg p-4">
                <CarePlanPreviewSection 
                  clientId={appointment.client_id || appointment.clients?.id} 
                  compact={false}
                  showHeader={true}
                />
              </div>
            </>
          )}

          {/* Unavailability Request Status */}
          {appointment.unavailability_request && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Unavailability Request Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="custom" className={getUnavailabilityStatusBadge(appointment.unavailability_request.status)?.className}>
                      {getUnavailabilityStatusBadge(appointment.unavailability_request.status)?.label}
                    </Badge>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground">Reason</span>
                    <p className="text-sm mt-1">{appointment.unavailability_request.reason}</p>
                  </div>
                  
                  {appointment.unavailability_request.notes && (
                    <div>
                      <span className="text-sm text-muted-foreground">Additional Notes</span>
                      <p className="text-sm mt-1">{appointment.unavailability_request.notes}</p>
                    </div>
                  )}
                  
                  {appointment.unavailability_request.admin_notes && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-200">Admin Response</span>
                      <p className="text-sm mt-1 text-blue-800 dark:text-blue-300">{appointment.unavailability_request.admin_notes}</p>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Requested on {format(new Date(appointment.unavailability_request.requested_at), 'PPP \'at\' p')}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <Separator />
          <div className="flex flex-col gap-2 sm:gap-3">
            {appointment.status === 'completed' && (
              <Button onClick={() => {
                if (onViewSummary) {
                  onViewSummary(appointment);
                } else {
                  window.location.href = `/carer-dashboard/visit/${appointment.id}?mode=view`;
                }
                onOpenChange(false);
              }} className="w-full bg-green-600 hover:bg-green-700">
                View Summary
              </Button>
            )}
            {(appointment.status === 'in-progress' || appointment.status === 'in_progress') && (
              <Button onClick={handleContinueVisit} className="w-full">
                Continue Visit
              </Button>
            )}
            {canStartAppointment(appointment) && appointment.status === 'assigned' && (
              <Button onClick={handleStartVisit} className="w-full">
                Start Visit
              </Button>
            )}
            
            {appointment.unavailability_request?.status === 'pending' && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs sm:text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Your unavailability request is pending admin review.</span>
              </div>
            )}

            {appointment.status === 'assigned' && 
             new Date(appointment.start_time) > new Date() && 
             !appointment.unavailability_request && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  onRequestUnavailability?.(appointment);
                  onOpenChange(false);
                }}
                className="w-full flex items-center justify-center gap-2"
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