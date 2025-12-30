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
import { format, startOfMonth, endOfMonth, isAfter, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { FileText, Download, AlertCircle } from 'lucide-react';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';

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
  
  // Date range state - default to current month
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(currentDate));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(currentDate));

  // Validation
  const isValidRange = useMemo(() => {
    if (!startDate || !endDate) return false;
    return !isAfter(startDate, endDate);
  }, [startDate, endDate]);

  // Filter events based on date range AND deduplicate by event ID
  const filteredEvents = useMemo(() => {
    if (!startDate || !endDate || !isValidRange) return [];
    
    const eventsInRange = events.filter(event => 
      isWithinInterval(event.startTime, { 
        start: startOfDay(startDate), 
        end: endOfDay(endDate) 
      })
    );
    
    // Deduplicate by event ID - each event appears only once
    const uniqueEvents = eventsInRange.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id)
    );
    
    return uniqueEvents;
  }, [events, startDate, endDate, isValidRange]);

  const handleExport = async () => {
    if (!startDate || !endDate || !isValidRange) return;
    
    setIsExporting(true);
    
    try {
      // Prepare export data with combined Date & Time column
      const exportData = filteredEvents.map(event => ({
        'Date & Time': `${format(event.startTime, 'dd/MM/yyyy')} | ${format(event.startTime, 'HH:mm')} - ${format(event.endTime, 'HH:mm')}`,
        Client: event.title || '-',
        Carer: event.participants?.map(p => p.name).join(', ') || 'Not assigned',
        Type: event.type.charAt(0).toUpperCase() + event.type.slice(1),
        Status: event.status?.charAt(0).toUpperCase() + (event.status?.slice(1) || ''),
      }));

      // Core columns - 5 columns with combined Date & Time
      const columns = [
        'Date & Time',
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
            Export {filteredEvents.length} calendar events
            {startDate && endDate && isValidRange && (
              <> for {format(startDate, 'dd MMM yyyy')} - {format(endDate, 'dd MMM yyyy')}</>
            )}
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
              disabled={isExporting || !isValidRange || !startDate || !endDate || filteredEvents.length === 0}
            >
              {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
