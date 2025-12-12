import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Copy, Loader2, AlertCircle } from 'lucide-react';
import { format, addWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import { useReplicateBookings, getWeekBoundaries, fetchBookingsToReplicate, ReplicationMode, ReplicationOptions } from '@/hooks/useReplicateBookings';
import { useQuery } from '@tanstack/react-query';
import { CalendarEvent } from '@/types/calendar';

interface ReplicateRotaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  currentDate: Date;
  selectedEvent?: CalendarEvent | null;
}

export const ReplicateRotaDialog: React.FC<ReplicateRotaDialogProps> = ({
  open,
  onOpenChange,
  branchId,
  currentDate,
  selectedEvent
}) => {
  // Default mode based on whether a single event is selected
  const defaultMode: ReplicationMode = selectedEvent ? 'single' : 'this-week';
  
  const [mode, setMode] = useState<ReplicationMode>(defaultMode);
  const [targetDate, setTargetDate] = useState<Date>(addWeeks(currentDate, 1));
  const [customSourceStart, setCustomSourceStart] = useState<Date>(currentDate);
  const [customSourceEnd, setCustomSourceEnd] = useState<Date>(currentDate);
  const [recurringWeeks, setRecurringWeeks] = useState<number>(4);
  const [includeStaff, setIncludeStaff] = useState<boolean>(true);
  const [includeCancelled, setIncludeCancelled] = useState<boolean>(false);
  const [targetDateOpen, setTargetDateOpen] = useState(false);
  const [sourceStartOpen, setSourceStartOpen] = useState(false);
  const [sourceEndOpen, setSourceEndOpen] = useState(false);

  const replicateMutation = useReplicateBookings();

  // Calculate source dates based on mode
  const sourceDates = useMemo(() => {
    if (mode === 'single' && selectedEvent) {
      const eventDate = new Date(selectedEvent.startTime);
      return { start: eventDate, end: eventDate };
    }
    if (mode === 'this-week' || mode === 'recurring') {
      return getWeekBoundaries(currentDate);
    }
    if (mode === 'custom') {
      return { start: customSourceStart, end: customSourceEnd };
    }
    return getWeekBoundaries(currentDate);
  }, [mode, currentDate, customSourceStart, customSourceEnd, selectedEvent]);

  // Build preview options
  const previewOptions: ReplicationOptions = useMemo(() => ({
    mode,
    sourceStartDate: sourceDates.start,
    sourceEndDate: mode === 'single' ? addWeeks(sourceDates.start, 1) : sourceDates.end,
    targetStartDate: targetDate,
    recurringWeeks: mode === 'recurring' ? recurringWeeks : 1,
    includeStaff,
    includeCancelled,
    branchId,
    singleBookingId: mode === 'single' && selectedEvent ? selectedEvent.id : undefined
  }), [mode, sourceDates, targetDate, recurringWeeks, includeStaff, includeCancelled, branchId, selectedEvent]);

  // Fetch preview of bookings to replicate
  const { data: previewBookings, isLoading: previewLoading } = useQuery({
    queryKey: ['replicate-preview', previewOptions],
    queryFn: () => fetchBookingsToReplicate(previewOptions),
    enabled: open && !!branchId,
  });

  const previewCount = previewBookings?.length || 0;
  const totalToCreate = mode === 'recurring' ? previewCount * recurringWeeks : previewCount;

  const handleReplicate = async () => {
    if (!branchId) return;

    await replicateMutation.mutateAsync(previewOptions);
    onOpenChange(false);
  };

  const handleModeChange = (value: string) => {
    setMode(value as ReplicationMode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Replicate Rota / Bookings
          </DialogTitle>
          <DialogDescription>
            Copy bookings from one period to another. This helps you quickly set up recurring schedules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Replication Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Replication Mode</Label>
            <RadioGroup value={mode} onValueChange={handleModeChange} className="space-y-2">
              {selectedEvent && (
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single" className="flex-1 cursor-pointer">
                    <div className="font-medium">This Booking</div>
                    <div className="text-xs text-muted-foreground">
                      Duplicate "{selectedEvent.title}" to a new date
                    </div>
                  </Label>
                </div>
              )}
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="this-week" id="this-week" />
                <Label htmlFor="this-week" className="flex-1 cursor-pointer">
                  <div className="font-medium">This Week</div>
                  <div className="text-xs text-muted-foreground">
                    Copy all bookings from {format(sourceDates.start, 'MMM d')} - {format(sourceDates.end, 'MMM d')}
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="recurring" id="recurring" />
                <Label htmlFor="recurring" className="flex-1 cursor-pointer">
                  <div className="font-medium">This Week and Beyond</div>
                  <div className="text-xs text-muted-foreground">
                    Repeat this week's schedule for multiple weeks
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="flex-1 cursor-pointer">
                  <div className="font-medium">Custom Date Range</div>
                  <div className="text-xs text-muted-foreground">
                    Select specific source and target dates
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Source Date Range */}
          {mode === 'custom' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Source Date Range</Label>
              <div className="flex items-center gap-2">
                <Popover open={sourceStartOpen} onOpenChange={setSourceStartOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !customSourceStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customSourceStart ? format(customSourceStart, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customSourceStart}
                      onSelect={(date) => {
                        if (date) setCustomSourceStart(date);
                        setSourceStartOpen(false);
                      }}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover open={sourceEndOpen} onOpenChange={setSourceEndOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !customSourceEnd && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customSourceEnd ? format(customSourceEnd, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customSourceEnd}
                      onSelect={(date) => {
                        if (date) setCustomSourceEnd(date);
                        setSourceEndOpen(false);
                      }}
                      disabled={(date) => date < customSourceStart}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Target Date */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {mode === 'single' ? 'Target Date' : 'Target Week Starting'}
            </Label>
            <Popover open={targetDateOpen} onOpenChange={setTargetDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !targetDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetDate ? format(targetDate, "PPP") : "Select target date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={(date) => {
                    if (date) setTargetDate(date);
                    setTargetDateOpen(false);
                  }}
                  disabled={(date) => date <= new Date()}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Recurring Weeks */}
          {mode === 'recurring' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Number of Weeks to Replicate</Label>
              <Input
                type="number"
                min={1}
                max={52}
                value={recurringWeeks}
                onChange={(e) => setRecurringWeeks(Math.max(1, Math.min(52, parseInt(e.target.value) || 1)))}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Bookings will be replicated for {recurringWeeks} week{recurringWeeks !== 1 ? 's' : ''} starting {format(targetDate, 'MMM d, yyyy')}
              </p>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeStaff"
                  checked={includeStaff}
                  onCheckedChange={(checked) => setIncludeStaff(checked as boolean)}
                />
                <Label htmlFor="includeStaff" className="text-sm cursor-pointer">
                  Preserve staff assignments
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCancelled"
                  checked={includeCancelled}
                  onCheckedChange={(checked) => setIncludeCancelled(checked as boolean)}
                />
                <Label htmlFor="includeCancelled" className="text-sm cursor-pointer">
                  Include cancelled bookings
                </Label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {previewLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Preview</span>
              </div>
              {!previewLoading && (
                <span className="text-sm text-muted-foreground">
                  {previewCount} source booking{previewCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {!previewLoading && previewCount > 0 && (
              <div className="mt-2 text-sm">
                <span className="font-medium text-primary">{totalToCreate}</span>
                <span className="text-muted-foreground"> new booking{totalToCreate !== 1 ? 's' : ''} will be created</span>
              </div>
            )}
            {!previewLoading && previewCount === 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>No bookings found in the selected date range</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReplicate}
            disabled={replicateMutation.isPending || previewCount === 0}
          >
            {replicateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Replicating...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Replicate {totalToCreate} Booking{totalToCreate !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
