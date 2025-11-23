import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, Heart, FileText, RotateCcw, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalendarEvent } from '@/types/calendar';
import { getAppointmentStatusColor, getEventTypeBadgeColor } from '@/utils/clientCalendarHelpers';
import { RescheduleAppointmentDialog } from '@/components/client/RescheduleAppointmentDialog';
import { CancelBookingDialog } from '@/components/client/CancelBookingDialog';

interface ClientAppointmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
}

export const ClientAppointmentDetailsDialog: React.FC<ClientAppointmentDetailsDialogProps> = ({
  open,
  onOpenChange,
  event
}) => {
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (!event) return null;

  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  const sourceBadge = event.type === 'booking' ? 'Care Service' : 'External Appointment';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl">{event.title}</DialogTitle>
            <div className="flex flex-col gap-2 items-end">
              <Badge className={getAppointmentStatusColor(event.status)}>
                {event.status}
              </Badge>
              <Badge variant="outline" className={getEventTypeBadgeColor(event.type)}>
                {sourceBadge}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(startTime, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')} ({duration} minutes)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Provider/Staff Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-foreground">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">
                  {event.type === 'booking' ? 'Care Provider' : 'Provider'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {event.participants[0]?.name || 'Not assigned'}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3 text-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Additional Info for Care Services */}
          {event.type === 'booking' && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-foreground">Care Service Information</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                This is a scheduled care service appointment. Your care provider will arrive at the specified time to provide the care services outlined in your care plan.
              </p>
            </div>
          )}

          {/* Notes Section */}
          {event.type === 'meeting' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium text-foreground">Additional Information</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Please arrive 10 minutes early for your appointment. If you need to reschedule or have any questions, please contact your care coordinator.
              </p>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          {event._rawAppointmentData && (
            <div className="flex gap-3">
              <Button 
                className="flex-1"
                variant="outline"
                onClick={() => setRescheduleDialogOpen(true)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Request Reschedule
              </Button>
              <Button 
                className="flex-1"
                variant="outline"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Request Cancellation
              </Button>
            </div>
          )}
        </div>

        {/* Nested Dialogs */}
        {event._rawAppointmentData && (
          <>
            <RescheduleAppointmentDialog
              open={rescheduleDialogOpen}
              onOpenChange={setRescheduleDialogOpen}
              appointment={event._rawAppointmentData}
            />

            <CancelBookingDialog
              open={cancelDialogOpen}
              onOpenChange={setCancelDialogOpen}
              booking={event._rawAppointmentData}
              onSubmit={async () => {
                onOpenChange(false);
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
