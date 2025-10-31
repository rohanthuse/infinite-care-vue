import React from 'react';
import { format } from 'date-fns';
import { GraduationCap, Calendar, Clock, User, MapPin, FileText, Trash2, Edit, Building2 } from 'lucide-react';
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

interface ViewTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  training: any;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ViewTrainingDialog: React.FC<ViewTrainingDialogProps> = ({
  open,
  onOpenChange,
  training,
  onEdit,
  onDelete,
}) => {
  if (!training) return null;

  // Parse time from training_notes (handles both \n and | separators)
  const timeMatch = training.training_notes?.match(/Time:\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  const startTime = timeMatch?.[1] || 'N/A';
  const endTime = timeMatch?.[2] || 'N/A';
  
  console.log('[ViewTrainingDialog] Parsed time:', { 
    notes: training.training_notes, 
    startTime, 
    endTime,
    hasTimeData: !!timeMatch 
  });
  
  // Parse location from training_notes (handles both \n and | separators)
  const locationMatch = training.training_notes?.match(/Location:\s*(.+?)(?:\n|\||$)/);
  const location = locationMatch?.[1]?.trim() || 'Not specified';

  // Clean notes (remove metadata)
  const cleanNotes = training.training_notes
    ?.replace(/Time: .+\n?/, '')
    ?.replace(/Location: .+\n?/, '')
    ?.trim();

  // Calculate duration
  const calculateDuration = () => {
    if (startTime === 'N/A' || endTime === 'N/A') return 'N/A';
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const duration = calculateDuration();

  // Get training category color
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'core':
        return 'bg-blue-100 text-blue-800';
      case 'mandatory':
        return 'bg-red-100 text-red-800';
      case 'specialized':
        return 'bg-purple-100 text-purple-800';
      case 'optional':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const staffName = training.staff 
    ? `${training.staff.first_name} ${training.staff.last_name}`
    : 'N/A';

  const branchName = training.branches?.name || 'N/A';
  const courseTitle = training.training_courses?.title || 'Training Course';
  const courseDescription = training.training_courses?.description;
  const courseCategory = training.training_courses?.category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <GraduationCap className="h-5 w-5" />
            View Training Details
          </DialogTitle>
          <DialogDescription>
            Training course information and schedule
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category and Status */}
          <div className="flex items-center justify-between">
            {courseCategory && (
              <Badge className={getCategoryColor(courseCategory)}>
                {courseCategory.charAt(0).toUpperCase() + courseCategory.slice(1)}
              </Badge>
            )}
            <Badge className={getStatusColor(training.status)}>
              {training.status?.replace('-', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Badge>
          </div>

          <Separator />

          {/* Course Title */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <GraduationCap className="h-4 w-4" />
              Training Course
            </div>
            <div className="pl-6">
              <span className="text-lg font-semibold">{courseTitle}</span>
              {courseDescription && (
                <p className="text-sm text-gray-600 mt-1">{courseDescription}</p>
              )}
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
                  {training.assigned_date 
                    ? format(new Date(training.assigned_date), "EEEE, MMMM d, yyyy")
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Start Time:</span>
                <span className="text-sm font-medium">{startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">End Time:</span>
                <span className="text-sm font-medium">{endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="text-sm font-medium">{duration}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Participants */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4" />
              Staff Member
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-medium">{staffName}</span>
              </div>
              {training.staff?.email && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium">{training.staff.email}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Branch */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Building2 className="h-4 w-4" />
              Branch
            </div>
            <div className="pl-6">
              <span className="text-sm font-medium">{branchName}</span>
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
              <span className="text-sm font-medium">{location}</span>
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

          {/* Training Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="h-4 w-4" />
              Training Details
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Training ID:</span>
                <span className="text-sm font-medium font-mono">{training.id}</span>
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
                    Delete Training
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this training record. This action cannot be undone.
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
                  Edit Training
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
