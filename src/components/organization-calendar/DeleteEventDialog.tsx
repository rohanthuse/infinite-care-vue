import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CalendarEvent } from '@/types/calendar';
import { format } from 'date-fns';

interface DeleteEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onConfirm: (event: CalendarEvent) => void;
  isDeleting?: boolean;
}

export const DeleteEventDialog: React.FC<DeleteEventDialogProps> = ({
  open,
  onOpenChange,
  event,
  onConfirm,
  isDeleting = false,
}) => {
  if (!event) return null;

  const handleConfirm = () => {
    onConfirm(event);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Event</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-muted-foreground">
                {format(event.startTime, 'MMM d, yyyy HH:mm')} - {format(event.endTime, 'HH:mm')}
              </p>
              <p className="text-sm text-muted-foreground capitalize">{event.type}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Event'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};