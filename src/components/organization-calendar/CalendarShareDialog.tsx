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
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: CalendarEvent[];
  currentDate: Date;
  branchName?: string;
  branchId?: string;
}

export const CalendarShareDialog: React.FC<CalendarShareDialogProps> = ({
  open,
  onOpenChange,
  events,
  currentDate,
  branchName,
  branchId,
}) => {
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeParticipants, setIncludeParticipants] = useState(true);
  const [includeConflicts, setIncludeConflicts] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      // Prepare export data with improved structure (matching export dialog)
      const exportData = events.map(event => ({
        Date: format(event.startTime, 'dd/MM/yyyy'),
        Time: `${format(event.startTime, 'HH:mm')} - ${format(event.endTime, 'HH:mm')}`,
        'Client/Title': event.title,
        'Carer/Staff': event.participants?.map(p => p.name).join(', ') || 'Not assigned',
        Type: event.type.charAt(0).toUpperCase() + event.type.slice(1),
        Status: event.status?.charAt(0).toUpperCase() + (event.status?.slice(1) || ''),
        Branch: event.branchName || branchName || '-',
        Location: event.location || '-',
        ...(includeParticipants && {
          Participants: event.participants?.map(p => p.name).join(', ') || 'None'
        }),
        ...(includeDetails && {
          Priority: event.priority || 'Normal',
        }),
        ...(includeConflicts && {
          Conflicts: event.conflictsWith?.length ? `${event.conflictsWith.length} conflict(s)` : 'None'
        }),
      }));

      const columns = [
        'Date',
        'Time',
        'Client/Title',
        'Carer/Staff',
        'Type',
        'Status',
        'Branch',
        'Location',
        ...(includeParticipants ? ['Participants'] : []),
        ...(includeDetails ? ['Priority'] : []),
        ...(includeConflicts ? ['Conflicts'] : []),
      ];

      // Generate PDF blob for sharing using dedicated calendar method
      const pdfBlob = await ReportExporter.exportCalendarToPDFBlob({
        title: 'Organisation Calendar Report',
        data: exportData,
        columns,
        branchName,
        branchId,
        dateRange: {
          from: startOfMonth(currentDate),
          to: endOfMonth(currentDate)
        },
        metadata: {
          exportedRecords: events.length,
          filters: {
            month: format(currentDate, 'MMMM yyyy'),
            branch: branchName || 'All Branches'
          }
        }
      });

      const fileName = `Calendar_${format(currentDate, 'yyyy-MM')}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Try Web Share API if available
      if (navigator.share && navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({
          title: 'Organisation Calendar Report',
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
