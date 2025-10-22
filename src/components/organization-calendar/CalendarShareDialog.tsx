import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarEvent } from '@/types/calendar';
import { ReportExporter } from '@/utils/reportExporter';
import { format } from 'date-fns';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: CalendarEvent[];
  currentDate: Date;
  branchName?: string;
}

export const CalendarShareDialog: React.FC<CalendarShareDialogProps> = ({
  open,
  onOpenChange,
  events,
  currentDate,
  branchName,
}) => {
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeParticipants, setIncludeParticipants] = useState(true);
  const [includeConflicts, setIncludeConflicts] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      // Prepare export data
      const exportData = events.map(event => ({
        Title: event.title,
        Type: event.type,
        Status: event.status,
        'Start Time': format(event.startTime, 'MMM d, yyyy HH:mm'),
        'End Time': format(event.endTime, 'MMM d, yyyy HH:mm'),
        Branch: event.branchName,
        Location: event.location || 'Not specified',
        ...(includeParticipants && {
          Participants: event.participants?.map(p => p.name).join(', ') || 'None'
        }),
        ...(includeDetails && {
          Priority: event.priority,
        }),
        ...(includeConflicts && event.conflictsWith?.length && {
          Conflicts: `${event.conflictsWith.length} conflicts`
        }),
      }));

      const columns = [
        'Title',
        'Type', 
        'Status',
        'Start Time',
        'End Time',
        'Branch',
        'Location',
        ...(includeParticipants ? ['Participants'] : []),
        ...(includeDetails ? ['Priority'] : []),
        ...(includeConflicts ? ['Conflicts'] : []),
      ];

      // Generate PDF blob for sharing
      const pdfBlob = ReportExporter.exportToPDFBlob({
        title: 'Organization Calendar Report',
        data: exportData,
        columns,
        branchName,
        dateRange: {
          from: currentDate,
          to: currentDate
        }
      });

      const fileName = `Calendar_${format(currentDate, 'yyyy-MM')}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Try Web Share API if available
      if (navigator.share && navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({
          title: 'Organization Calendar Report',
          text: `Calendar events for ${format(currentDate, 'MMMM yyyy')}`,
          files: [pdfFile]
        });
        
        toast.success('Calendar shared successfully!');
      } else {
        // Fallback: Download PDF
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success('PDF downloaded! You can now share it manually.');
      }

      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled the share
        console.log('Share cancelled by user');
      } else {
        console.error('Share error:', error);
        toast.error('Failed to share calendar. Please try again.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Calendar
          </DialogTitle>
          <DialogDescription>
            Share {events.length} calendar events for {format(currentDate, 'MMMM yyyy')} as PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Options */}
          <div className="space-y-3">
            <Label>Include in Share</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="details" 
                checked={includeDetails}
                onCheckedChange={(checked) => setIncludeDetails(checked === true)}
              />
              <Label htmlFor="details" className="text-sm">Event details (priority, etc.)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="participants" 
                checked={includeParticipants}
                onCheckedChange={(checked) => setIncludeParticipants(checked === true)}
              />
              <Label htmlFor="participants" className="text-sm">Participant information</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="conflicts" 
                checked={includeConflicts}
                onCheckedChange={(checked) => setIncludeConflicts(checked === true)}
              />
              <Label htmlFor="conflicts" className="text-sm">Conflict information</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSharing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleShare}
              disabled={isSharing}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {isSharing ? 'Preparing...' : 'Share PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
