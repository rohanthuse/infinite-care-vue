import React, { useState, useMemo } from 'react';
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
import { format, startOfMonth, endOfMonth, isAfter, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Share2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';

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
  
  // Date range state - default to current month
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(currentDate));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(currentDate));

  // Validation
  const isValidRange = useMemo(() => {
    if (!startDate || !endDate) return false;
    return !isAfter(startDate, endDate);
  }, [startDate, endDate]);

  // Filter events based on date range
  const filteredEvents = useMemo(() => {
    if (!startDate || !endDate || !isValidRange) return [];
    return events.filter(event => 
      isWithinInterval(event.startTime, { 
        start: startOfDay(startDate), 
        end: endOfDay(endDate) 
      })
    );
  }, [events, startDate, endDate, isValidRange]);

  const handleShare = async () => {
    if (!startDate || !endDate || !isValidRange) return;
    
    setIsSharing(true);
    
    try {
      // Prepare export data with separate columns - matches export dialog for consistency
      const exportData = filteredEvents.map(event => ({
        Date: format(event.startTime, 'dd/MM/yyyy'),
        Start: format(event.startTime, 'HH:mm'),
        End: format(event.endTime, 'HH:mm'),
        Client: event.title || '-',
        Carer: event.participants?.map(p => p.name).join(', ') || 'Not assigned',
        Type: event.type.charAt(0).toUpperCase() + event.type.slice(1),
        Status: event.status?.charAt(0).toUpperCase() + (event.status?.slice(1) || ''),
      }));

      // Core columns - always included
      const columns = [
        'Date',
        'Start',
        'End',
        'Client',
        'Carer', 
        'Type',
        'Status',
      ];

      const exportOptions = {
        title: 'Organisation Calendar Report',
        data: exportData,
        columns,
        branchName,
        branchId,
        dateRange: {
          from: startDate,
          to: endDate
        },
        metadata: {
          exportedRecords: filteredEvents.length,
          filters: {
            dateRange: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
            branch: branchName || 'All Branches'
          }
        }
      };

      // Generate PDF blob using the same method as export for consistency
      const pdfBlob = await ReportExporter.exportCalendarToPDFBlob(exportOptions);
      const fileName = `Organisation_Calendar_${format(startDate, 'ddMMMyyyy')}_${format(endDate, 'ddMMMyyyy')}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Try Web Share API if available
      if (navigator.share && navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({
          title: 'Organisation Calendar Report',
          text: `Calendar events from ${format(startDate, 'dd MMM yyyy')} to ${format(endDate, 'dd MMM yyyy')}`,
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
            Share {filteredEvents.length} calendar events
            {startDate && endDate && isValidRange && (
              <> for {format(startDate, 'dd MMM yyyy')} - {format(endDate, 'dd MMM yyyy')}</>
            )} as PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Range Selection */}
          <div className="space-y-3">
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="startDate" className="text-xs text-muted-foreground">Start Date</Label>
                <EnhancedDatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Start date"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate" className="text-xs text-muted-foreground">End Date</Label>
                <EnhancedDatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="End date"
                />
              </div>
            </div>
            {startDate && endDate && !isValidRange && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                End date must be after or equal to start date
              </div>
            )}
          </div>

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
              disabled={isSharing || !isValidRange || !startDate || !endDate || filteredEvents.length === 0}
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
