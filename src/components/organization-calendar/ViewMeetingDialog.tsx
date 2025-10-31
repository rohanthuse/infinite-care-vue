import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, MapPin, FileText, Trash2, Edit, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
} from '@/components/ui/alert-dialog';

interface ViewMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ViewMeetingDialog: React.FC<ViewMeetingDialogProps> = ({
  open,
  onOpenChange,
  appointment,
  onEdit,
  onDelete,
}) => {
  if (!appointment) return null;

  // Parse meeting type and title from appointment_type
  const meetingTypeMatch = appointment.appointment_type?.match(/^(Client|Internal|Personal|Third Party) Meeting: (.+)$/);
  const meetingType = meetingTypeMatch?.[1] || 'Meeting';
  const meetingTitle = meetingTypeMatch?.[2] || appointment.appointment_type;

  // Extract staff ID from notes
  const staffIdMatch = appointment.notes?.match(/Staff ID: ([a-f0-9-]+)/);
  const staffId = staffIdMatch?.[1];

  // Clean notes (remove metadata)
  const cleanNotes = appointment.notes
    ?.replace(/Meeting Type: .+\n?/, '')
    .replace(/Staff ID: .+\n?/, '')
    .trim();

  // Calculate end time (1 hour after start)
  const calculateEndTime = () => {
    if (!appointment.appointment_time) return 'N/A';
    const [hours, minutes] = appointment.appointment_time.split(':').map(Number);
    const endHours = (hours + 1) % 24;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const endTime = calculateEndTime();

  // Get meeting type color
  const getMeetingTypeColor = () => {
    switch (meetingType.toLowerCase()) {
      case 'client':
        return 'bg-blue-100 text-blue-800';
      case 'internal':
        return 'bg-purple-100 text-purple-800';
      case 'personal':
        return 'bg-green-100 text-green-800';
      case 'third party':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clientName = appointment.clients 
    ? `${appointment.clients.first_name} ${appointment.clients.last_name}`
    : null;

  const branchName = appointment.branches?.name || 'N/A';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-600">
            <Users className="h-5 w-5" />
            View Meeting Details
          </DialogTitle>
          <DialogDescription>
            Meeting information and details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meeting Type and Status */}
          <div className="flex items-center justify-between">
            <Badge className={getMeetingTypeColor()}>
              {meetingType} Meeting
            </Badge>
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          {/* Meeting Title */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4" />
              Meeting Title
            </div>
            <div className="pl-6">
              <span className="text-lg font-semibold">{meetingTitle}</span>
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
                  {appointment.appointment_date 
                    ? format(new Date(appointment.appointment_date), "EEEE, MMMM d, yyyy")
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Start Time:</span>
                <span className="text-sm font-medium">
                  {appointment.appointment_time || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">End Time:</span>
                <span className="text-sm font-medium">{endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="text-sm font-medium">1 hour</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Participants */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4" />
              Participants
            </div>
            <div className="pl-6 space-y-1">
              {clientName && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Client:</span>
                  <span className="text-sm font-medium">{clientName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Staff Member:</span>
                <span className="text-sm font-medium">
                  {appointment.provider_name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Branch:</span>
                <span className="text-sm font-medium">{branchName}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4" />
              Location
            </div>
            <div className="pl-6">
              <span className="text-sm font-medium">
                {appointment.location || 'Not specified'}
              </span>
            </div>
          </div>

          {cleanNotes && (
            <>
              <Separator />
              
              {/* Notes */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="h-4 w-4" />
                  Notes
                </div>
                <div className="pl-6">
                  <div className="text-sm font-medium whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-md">
                    {cleanNotes}
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Meeting Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="h-4 w-4" />
              Meeting Details
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Meeting ID:</span>
                <span className="text-sm font-medium font-mono">{appointment.id}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Meeting
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this meeting. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {onEdit && (
                <Button onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Meeting
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
