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
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { FileText, Download } from 'lucide-react';

interface CalendarExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: CalendarEvent[];
  currentDate: Date;
  branchName?: string;
  branchId?: string;
}

export const CalendarExportDialog: React.FC<CalendarExportDialogProps> = ({
  open,
  onOpenChange,
  events,
  currentDate,
  branchName,
  branchId,
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeParticipants, setIncludeParticipants] = useState(true);
  const [includeConflicts, setIncludeConflicts] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Prepare export data with improved structure
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

      const exportOptions = {
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
      };

      if (exportFormat === 'pdf') {
        await ReportExporter.exportCalendarToPDF(exportOptions);
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