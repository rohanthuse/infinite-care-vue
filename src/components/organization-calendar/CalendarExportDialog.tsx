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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarEvent } from '@/types/calendar';
import { ReportExporter } from '@/utils/reportExporter';
import { format } from 'date-fns';
import { FileText, Download } from 'lucide-react';

interface CalendarExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: CalendarEvent[];
  currentDate: Date;
  branchName?: string;
}

export const CalendarExportDialog: React.FC<CalendarExportDialogProps> = ({
  open,
  onOpenChange,
  events,
  currentDate,
  branchName,
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeParticipants, setIncludeParticipants] = useState(true);
  const [includeConflicts, setIncludeConflicts] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
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
          Conflicts: event.conflictsWith.length > 0 ? `${event.conflictsWith.length} conflicts` : 'None'
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

      const exportOptions = {
        title: 'Organisation Calendar Report',
        data: exportData,
        columns,
        branchName,
        dateRange: {
          from: currentDate,
          to: currentDate
        }
      };

      if (exportFormat === 'pdf') {
        ReportExporter.exportToPDF(exportOptions);
      } else {
        ReportExporter.exportToCSV(exportOptions);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Calendar
          </DialogTitle>
          <DialogDescription>
            Export {events.length} calendar events for {format(currentDate, 'MMMM yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'pdf' | 'csv') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Document
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV Spreadsheet
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            
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
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};