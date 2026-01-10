import React, { useState, useMemo } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { Search, Filter, Users, Clock, MapPin, PoundSterling, Download, StickyNote, XCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateNavigation } from "./DateNavigation";
import { BookingFilters } from "./BookingFilters";
import { Booking, Client, Carer } from "./BookingTimeGrid";
import { BookingsMonthView } from "./BookingsMonthView";
import { getBookingStatusColor, getBookingStatusLabel, getEffectiveBookingStatus } from "./utils/bookingColors";
import { getRequestStatusColors } from "./utils/requestIndicatorHelpers";
import { ClientScheduleDraggable } from "./ClientScheduleDraggable";

interface ClientScheduleCalendarProps {
  date: Date;
  bookings: Booking[];
  branchId?: string;
  onCreateBooking?: (clientId: string, timeSlot: string) => void;
  onViewBooking?: (booking: Booking) => void;
  onDateChange?: (date: Date) => void;
  clients?: Client[];
  carers?: Carer[];
  selectedClientIds?: string[];
  selectedCarerIds?: string[];
  selectedStatus?: string;
  viewType?: "daily" | "weekly" | "monthly";
  onClientChange?: (clientIds: string[]) => void;
  onCarerChange?: (carerIds: string[]) => void;
  onStatusChange?: (status: string) => void;
  hideControls?: boolean;
  timeInterval?: 30 | 60;
  selectedBookings?: Booking[];
  onBookingSelect?: (booking: Booking, selected: boolean) => void;
  enableDragDrop?: boolean;
}

interface ClientStatus {
  type: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'available';
  booking?: Booking;
}

interface BookingBlock {
  booking: Booking & {
    originalStartTime?: string;
    originalEndTime?: string;
    splitIndicator?: 'continues-next-day' | 'continued-from-previous-day';
  };
  startMinutes: number;
  durationMinutes: number;
  leftPosition: number;
  width: number;
  status: ClientStatus['type'];
  isSplit?: boolean;
  splitType?: 'first' | 'second';
}

interface ClientScheduleRow {
  id: string;
  name: string;
  status?: string;  // Client status for inactive indicator
  address?: string;
  postcode?: string;
  carePackage?: string;
  schedule: Record<string, ClientStatus>;
  bookingBlocks: BookingBlock[];
  totalCareHours: number;
  contractedHours: number;
}

export function ClientScheduleCalendar({ 
  date, 
  bookings, 
  branchId,
  onCreateBooking,
  onViewBooking,
  onDateChange,
  clients = [],
  carers = [],
  selectedClientIds = [],
  selectedCarerIds = [],
  selectedStatus,
  viewType = "daily",
  onClientChange,
  onCarerChange,
  onStatusChange,
  hideControls = false,
  timeInterval = 30,
  selectedBookings = [],
  onBookingSelect,
  enableDragDrop = false,
}: ClientScheduleCalendarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    showAll: true,
    activeOnly: false,
    scheduledOnly: false,
  });

  // Export functionality
  const handleExport = () => {
    const csvData = clientSchedule.map(client => ({
      name: client.name,
      address: client.address || '',
      totalHours: client.totalCareHours,
      contractedHours: client.contractedHours,
      utilization: ((client.totalCareHours / client.contractedHours) * 100).toFixed(1) + '%'
    }));

    const csvContent = [
      ['Name', 'Address', 'Scheduled Hours', 'Contracted Hours', 'Utilization'],
      ...csvData.map(row => [row.name, row.address, row.totalHours, row.contractedHours, row.utilization])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-schedule-${format(date, 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Layout constants for consistent width
  const LEFT_COL_WIDTH = 200; // Client info column width
  const SLOT_WIDTH = viewType === 'weekly' ? 120 : (timeInterval === 60 ? 64 : 32);
  const TOTAL_SLOTS = viewType === 'weekly' ? 7 : (timeInterval === 60 ? 24 : 48);
  const TOTAL_WIDTH = LEFT_COL_WIDTH + (SLOT_WIDTH * TOTAL_SLOTS);

  // Safe helper to get initials from a name
  const getInitials = (fullName?: string): string => {
    if (!fullName) return '';
    return fullName.split(' ').map(n => n[0] || '').join('').toUpperCase();
  };

  // Generate column headers based on view type
  const columnHeaders = useMemo(() => {
    if (viewType === 'weekly') {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => {
        const day = addDays(weekStart, i);
        return {
          label: format(day, 'EEE d'),
          fullLabel: format(day, 'EEEE, MMM d'),
          date: day,
          dateString: format(day, 'yyyy-MM-dd')
        };
      });
    } else if (viewType === 'monthly') {
      return [];
    } else {
      return [];
    }
  }, [viewType, date]);

  // Generate time slots based on interval (for daily view)
  const timeSlots = useMemo(() => {
    const slots = [];
    if (timeInterval === 60) {
      for (let i = 0; i < 24; i++) {
        slots.push(`${i.toString().padStart(2, '0')}:00`);
      }
    } else {
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        slots.push(`${hour}:00`);
        slots.push(`${hour}:30`);
      }
    }
    return slots;
  }, [timeInterval]);

  // Helper function to calculate booking block position
  const calculateBookingPosition = (startMinutes: number, durationMinutes: number): { left: number; width: number } => {
    // Safety check: ensure duration is never negative
    const safeDuration = Math.max(0, durationMinutes);
    
    // Calculate position based on start time as fraction of time slots
    const slotsFromStart = startMinutes / timeInterval;
    const left = slotsFromStart * SLOT_WIDTH;
    
    // Calculate width based on duration
    const durationInSlots = safeDuration / timeInterval;
    const width = durationInSlots * SLOT_WIDTH;
    
    return { left, width };
  };

  // Helper function to group bookings by client, date, and time slot
  const groupBookingsByTimeSlot = (bookings: Booking[]): Map<string, Booking[]> => {
    const grouped = new Map<string, Booking[]>();
    
    bookings.forEach(booking => {
      // Create unique key for same client, date, start time, end time
      const key = `${booking.clientId}-${booking.date}-${booking.startTime}-${booking.endTime}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(booking);
    });
    
    return grouped;
  };

  // Helper function to merge multiple booking records (multiple carers) into one
  const mergeBookingRecords = (bookings: Booking[]): Booking & { allCarerNames?: string[]; allCarerIds?: string[] } => {
    const firstBooking = bookings[0];
    const allCarerNames = bookings.map(b => b.carerName).filter(Boolean);
    const allCarerIds = bookings.map(b => b.carerId).filter(Boolean);
    
    // Check if any booking in the group has late/missed status
    const hasLateStart = bookings.some(b => b.is_late_start === true);
    const hasMissed = bookings.some(b => b.is_missed === true);
    const maxLateMinutes = Math.max(...bookings.map(b => b.late_start_minutes || 0));
    
    return {
      ...firstBooking,
      carerName: allCarerNames.join(', '), // "John Smith, Mary Johnson"
      allCarerNames, // Array for tooltip
      allCarerIds, // Array for reference
      // Preserve late/missed status from any booking in the group
      is_late_start: hasLateStart,
      is_missed: hasMissed,
      late_start_minutes: maxLateMinutes > 0 ? maxLateMinutes : firstBooking.late_start_minutes,
    };
  };

  // Process client schedule data
  const clientSchedule = useMemo(() => {
    if (viewType === 'weekly') {
      // Weekly view data structure
      const scheduleData = clients
        .filter(client => {
          // Filter by selected clients if any
          if (selectedClientIds && selectedClientIds.length > 0) {
            return selectedClientIds.includes(client.id);
          }
          return true;
        })
        .map(client => {
        const weekBookings: Record<string, Booking[]> = {};
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        
        // Initialize each weekday
        for (let i = 0; i < 7; i++) {
          const dayDate = format(addDays(weekStart, i), 'yyyy-MM-dd');
          weekBookings[dayDate] = [];
        }
        
        // Group bookings by day
        const clientBookings = bookings.filter(b => b.clientId === client.id);
        
        // Filter to only bookings within this week's date range for accurate weekly total
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');
        const weeklyClientBookings = clientBookings.filter(b => 
          b.date >= weekStartStr && b.date <= weekEndStr
        );
        
        // Group by time slot to merge multiple carers
        const groupedByDate: Record<string, Booking[]> = {};
        weeklyClientBookings.forEach(booking => {
          if (!groupedByDate[booking.date]) {
            groupedByDate[booking.date] = [];
          }
          groupedByDate[booking.date].push(booking);
        });

        // Merge bookings with same time slots for each day
        Object.keys(groupedByDate).forEach(dateKey => {
          const dayBookingsList = groupedByDate[dateKey];
          const grouped = groupBookingsByTimeSlot(dayBookingsList);
          
          Array.from(grouped.values()).forEach(bookingGroup => {
            const mergedBooking = mergeBookingRecords(bookingGroup);
            if (weekBookings[dateKey]) {
              weekBookings[dateKey].push(mergedBooking);
            }
          });
        });
        
        // Calculate total hours for the week (accounting for multiple carers)
        // Group bookings by time slot to identify multi-carer scenarios
        const weekGrouped = groupBookingsByTimeSlot(weeklyClientBookings);
        let totalWeekHours = 0;
        
        weekGrouped.forEach((bookingsInSlot) => {
          const b = bookingsInSlot[0];
          const [startH, startM] = b.startTime.split(':').map(Number);
          const [endH, endM] = b.endTime.split(':').map(Number);
          let durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
          // Handle midnight crossing
          if (durationMinutes < 0) {
            durationMinutes += 1440; // Add 24 hours
          }
          const duration = durationMinutes / 60;
          const carerCount = bookingsInSlot.length; // Number of carers = number of booking records
          totalWeekHours += duration * carerCount;
        });
        
        return {
          id: client.id,
          name: client.name,
          status: client.status,
          address: client.address || 'Address not available',
          postcode: client.postcode,
          weekBookings,
          totalWeekHours,
          contractedHours: 40
        };
      });
      
      // Apply filters
      let filteredData = scheduleData;
      if (searchTerm) {
        filteredData = filteredData.filter(client => 
          client.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (!filters.showAll) {
        filteredData = filteredData.filter(client => client.totalWeekHours > 0);
      }
      return filteredData;
    } else {
      // Daily view logic
      const scheduleData: ClientScheduleRow[] = clients
        .filter(client => {
          // Filter by selected clients if any
          if (selectedClientIds && selectedClientIds.length > 0) {
            return selectedClientIds.includes(client.id);
          }
          return true;
        })
        .map(client => {
        const schedule: Record<string, ClientStatus> = {};
        const bookingBlocks: BookingBlock[] = [];
        let totalCareHours = 0;
        
        // Initialize all time slots as available
        timeSlots.forEach(slot => {
          schedule[slot] = { type: 'available' };
        });

        // Add bookings for this client on this date
        const dayBookings = bookings.filter(booking => 
          booking.clientId === client.id && 
          booking.date === format(date, 'yyyy-MM-dd')
        );

        // Group bookings by time slot (to handle multiple carers)
        const groupedBookings = groupBookingsByTimeSlot(dayBookings);

        // Process each unique booking (merging multiple carers)
        Array.from(groupedBookings.values()).forEach(bookingGroup => {
          const booking = mergeBookingRecords(bookingGroup);
          const [startHour, startMin] = booking.startTime.split(':').map(Number);
          const [endHour, endMin] = booking.endTime.split(':').map(Number);
          
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          
          // Detect midnight crossing BEFORE we adjust duration
          const crossesMidnight = endMinutes < startMinutes;
          
          let statusType: ClientStatus['type'] = 'scheduled'; // default
          switch (booking.status) {
            case 'assigned':
              statusType = 'scheduled';
              break;
            case 'unassigned':
              statusType = 'scheduled'; // Show as scheduled but will use unassigned color
              break;
            case 'done':
              statusType = 'completed';
              break;
            case 'in-progress':
            case 'departed':
              statusType = 'in-progress';
              break;
            case 'cancelled':
              statusType = 'cancelled';
              break;
            case 'suspended':
              statusType = 'cancelled'; // Show as cancelled-like status
              break;
          }
          
          if (crossesMidnight) {
            // Block 1: From start time to end of day (23:59)
            const minutesUntilMidnight = 1440 - startMinutes; // 1440 = 24 hours in minutes
            const { left: left1, width: width1 } = calculateBookingPosition(startMinutes, minutesUntilMidnight);
            
            bookingBlocks.push({
              booking: {
                ...booking,
                endTime: '23:59',
                originalEndTime: booking.endTime,
                splitIndicator: 'continues-next-day'
              },
              startMinutes,
              durationMinutes: minutesUntilMidnight,
              leftPosition: left1,
              width: width1,
              status: statusType,
              isSplit: true,
              splitType: 'first'
            });
            
            // Mark time slots only until end of day
            timeSlots.forEach(slot => {
              const [slotHour, slotMin] = slot.split(':').map(Number);
              const slotMinutes = slotHour * 60 + slotMin;
              const nextSlotMinutes = slotMinutes + timeInterval;
              
              if (startMinutes < nextSlotMinutes && 1440 > slotMinutes) {
                schedule[slot] = {
                  type: statusType,
                  booking
                };
              }
            });
            
            // Update total hours calculation to use the portion on THIS day only
            // Multiply by number of carers assigned
            const carerCount = (booking as any).allCarerIds?.length || bookingGroup.length;
            totalCareHours += (minutesUntilMidnight / 60) * carerCount;
            
          } else {
            // Normal booking (doesn't cross midnight)
            const durationMinutes = endMinutes - startMinutes;
            const { left, width } = calculateBookingPosition(startMinutes, durationMinutes);
            
            bookingBlocks.push({
              booking,
              startMinutes,
              durationMinutes,
              leftPosition: left,
              width,
              status: statusType
            });
            
            timeSlots.forEach(slot => {
              const [slotHour, slotMin] = slot.split(':').map(Number);
              const slotMinutes = slotHour * 60 + slotMin;
              const nextSlotMinutes = slotMinutes + timeInterval;
              
              if (startMinutes < nextSlotMinutes && endMinutes > slotMinutes) {
                schedule[slot] = {
                  type: statusType,
                  booking
                };
              }
            });
            
            // Multiply by number of carers assigned
            const carerCount = (booking as any).allCarerIds?.length || bookingGroup.length;
            totalCareHours += (durationMinutes / 60) * carerCount;
          }
        });

        // Check for bookings from previous day that cross into current day
        const previousDayDate = format(addDays(date, -1), 'yyyy-MM-dd');
        const previousDayBookings = bookings.filter(booking => 
          booking.clientId === client.id && 
          booking.date === previousDayDate
        );

        previousDayBookings.forEach(booking => {
          const [startHour, startMin] = booking.startTime.split(':').map(Number);
          const [endHour, endMin] = booking.endTime.split(':').map(Number);
          
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          
          // If end time is less than start time, it crosses midnight
          if (endMinutes < startMinutes) {
            let statusType: ClientStatus['type'] = 'scheduled';
            switch (booking.status) {
              case 'assigned':
                statusType = 'scheduled';
                break;
              case 'unassigned':
                statusType = 'scheduled';
                break;
              case 'done':
                statusType = 'completed';
                break;
              case 'in-progress':
              case 'departed':
                statusType = 'in-progress';
                break;
              case 'cancelled':
                statusType = 'cancelled';
                break;
              case 'suspended':
                statusType = 'cancelled';
                break;
            }
            
            // Block 2: From midnight (0) to actual end time
            const { left, width } = calculateBookingPosition(0, endMinutes);
            
            bookingBlocks.push({
              booking: {
                ...booking,
                startTime: '00:00',
                originalStartTime: booking.startTime,
                splitIndicator: 'continued-from-previous-day'
              },
              startMinutes: 0,
              durationMinutes: endMinutes,
              leftPosition: left,
              width,
              status: statusType,
              isSplit: true,
              splitType: 'second'
            });
            
            // Mark time slots from midnight to end time
            timeSlots.forEach(slot => {
              const [slotHour, slotMin] = slot.split(':').map(Number);
              const slotMinutes = slotHour * 60 + slotMin;
              const nextSlotMinutes = slotMinutes + timeInterval;
              
              if (0 < nextSlotMinutes && endMinutes > slotMinutes) {
                schedule[slot] = {
                  type: statusType,
                  booking
                };
              }
            });
            
            totalCareHours += endMinutes / 60;
          }
        });

        return {
          id: client.id,
          name: client.name,
          status: client.status,
          address: client.address || 'Address not available',
          postcode: client.postcode,
          carePackage: 'Standard Care',
          schedule,
          bookingBlocks,
          totalCareHours,
          contractedHours: 8
        };
      });

      // Apply filters
      let filteredData = scheduleData;
      if (searchTerm) {
        filteredData = filteredData.filter(client => 
          client.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (!filters.showAll) {
        filteredData = filteredData.filter(client => client.totalCareHours > 0);
      }
      if (filters.activeOnly) {
        filteredData = filteredData.filter(client => 
          Object.values(client.schedule).some(status => status.type === 'in-progress')
        );
      }
      if (filters.scheduledOnly) {
        filteredData = filteredData.filter(client => client.totalCareHours > 0);
      }
      return filteredData;
    }
  }, [viewType, clients, bookings, date, timeSlots, searchTerm, filters, timeInterval]);

  const getStatusColor = (status: ClientStatus) => {
    // If there's a booking, use effective status for color (considers late/missed)
    if (status.booking) {
      const effectiveStatus = getEffectiveBookingStatus(status.booking);
      return getBookingStatusColor(effectiveStatus, 'light');
    }
    
    // Default colors for status types
    switch (status.type) {
      case 'scheduled':
        return 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-300';
      case 'in-progress':
        return 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/50 dark:border-purple-700 dark:text-purple-300';
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300';
      default:
        return 'bg-background border-border hover:bg-muted/50';
    }
  };

  const getStatusLabel = (status: ClientStatus) => {
    switch (status.type) {
      case 'scheduled':
      case 'in-progress':
      case 'completed':
      case 'cancelled':
        return getInitials(status.booking?.carerName);
      default:
        return '';
    }
  };

  const handleCellClick = (clientId: string, timeSlot: string, status: ClientStatus) => {
    // If there's a booking, view it; otherwise create a new one
    if (status.booking && onViewBooking) {
      onViewBooking(status.booking);
    } else if (status.type === 'available' && onCreateBooking) {
      onCreateBooking(clientId, timeSlot);
    }
  };

  const renderTooltipContent = (status: ClientStatus, clientName: string, onClickViewDetails?: () => void) => {
    if (status.type === 'available') {
      return (
        <div className="space-y-1">
          <p className="font-medium">{clientName}</p>
          <p className="text-sm text-muted-foreground">Available - Click to create booking</p>
        </div>
      );
    }
    
    if (status.booking) {
      const effectiveStatus = getEffectiveBookingStatus(status.booking);
      const statusLabel = getBookingStatusLabel(effectiveStatus);
      const statusColor = getBookingStatusColor(effectiveStatus, 'light');
      const allCarerNames = (status.booking as any).allCarerNames || [];
      const singleCarerName = status.booking.carerName;
      const hasMultipleCarers = allCarerNames.length > 1;
      const hasAssignedCarer = allCarerNames.length > 0 || (singleCarerName && singleCarerName.trim() !== '');
      
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium">{clientName}</p>
            <Badge variant="custom" className={statusColor}>
              {statusLabel}
            </Badge>
          </div>
          <div className="space-y-1 text-sm">
            {/* Carer Assignment Section */}
            <div>
              <span className="font-medium">
                {hasMultipleCarers ? 'Assigned Carers:' : 'Assigned Carer:'}
              </span>
              {!hasAssignedCarer ? (
                <span className="text-muted-foreground ml-1">Not assigned yet</span>
              ) : hasMultipleCarers ? (
                <ul className="mt-1 ml-4 list-disc space-y-0.5">
                  {allCarerNames.map((name: string, idx: number) => (
                    <li key={idx}>{name}</li>
                  ))}
                </ul>
              ) : (
                <span className="ml-1">{allCarerNames[0] || singleCarerName}</span>
              )}
            </div>
            
            <p><span className="font-medium">Time:</span> {status.booking.startTime} - {status.booking.endTime}</p>
            {status.booking.notes && (
              <p><span className="font-medium">Notes:</span> {status.booking.notes}</p>
            )}
          </div>
          {onClickViewDetails && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClickViewDetails();
              }}
              className="text-xs text-primary hover:underline cursor-pointer pt-1 border-t border-muted mt-2 w-full text-left"
            >
              Click to view details
            </button>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-1">
        <p className="font-medium">{clientName}</p>
        <p className="text-sm text-muted-foreground">{status.type}</p>
      </div>
    );
  };

  // Empty state
  if (clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            No clients found for this branch
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 h-full">
        {/* Date Navigation */}
        {!hideControls && onDateChange && (
          <DateNavigation
            currentDate={date}
            onDateChange={onDateChange}
            viewType="daily"
            onViewTypeChange={() => {}} // Not used in client schedule
          />
        )}

        {/* Booking Filters */}
        {!hideControls && (
          <BookingFilters
            statusFilter={selectedStatus || "all"}
            onStatusFilterChange={onStatusChange || (() => {})}
            selectedClientIds={selectedClientIds}
            onClientChange={onClientChange || (() => {})}
            selectedCarerIds={selectedCarerIds}
            onCarerChange={onCarerChange || (() => {})}
            clients={clients || []}
            carers={carers || []}
          />
        )}

        {/* Header with search and filters - Only show when hideControls is false */}
        {!hideControls && (
          <>
            <div className="flex flex-col gap-3">
              {/* Top row: Search */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
              </div>
              
              {/* Middle row: Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="showAll" 
                      checked={filters.showAll}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, showAll: checked as boolean }))
                      }
                    />
                    <label htmlFor="showAll" className="text-sm whitespace-nowrap">Show All Clients</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="activeOnly" 
                      checked={filters.activeOnly}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, activeOnly: checked as boolean }))
                      }
                    />
                    <label htmlFor="activeOnly" className="text-sm whitespace-nowrap">Active Sessions Only</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="scheduledOnly" 
                      checked={filters.scheduledOnly}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, scheduledOnly: checked as boolean }))
                      }
                    />
                    <label htmlFor="scheduledOnly" className="text-sm whitespace-nowrap">Scheduled Only</label>
                  </div>
                </div>
              </div>
              
              {/* Bottom row: Actions and date */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="w-full sm:w-auto flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <div className="text-sm text-muted-foreground">
                  {format(date, 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
            </div>

            {/* Status Legend */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700"></div>
                    <span>Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900/50 border border-orange-300 dark:border-orange-700"></div>
                    <span>In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700"></div>
                    <span>Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600"></div>
                    <span>Available</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Schedule Grid */}
        {viewType === 'monthly' ? (
          <ScrollArea className="h-full">
            <BookingsMonthView
              date={date}
              bookings={bookings}
              clients={clients}
              carers={carers}
              isLoading={false}
              onBookingClick={onViewBooking}
              onCreateBooking={(date, time, clientId) => {
                if (clientId && onCreateBooking) {
                  onCreateBooking(clientId, time);
                }
              }}
            />
          </ScrollArea>
        ) : (
        <div className="flex-1 min-h-0 flex flex-col">
        <div className="schedule-scroll border rounded-lg flex flex-col flex-1 min-h-0 max-w-full overflow-hidden">
          <div className="text-xs text-muted-foreground py-2 px-3 bg-muted/30 border-b flex-shrink-0">
            ← Scroll horizontally to see more {viewType === 'weekly' ? 'days' : 'time slots'} →
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            <div className="time-grid-inner" style={{ width: TOTAL_WIDTH }}>
              {/* Header row - sticky */}
              <div className="bg-muted/50 border-b flex sticky top-0 z-20" style={{ width: TOTAL_WIDTH }}>
                <div 
                  className="p-3 font-medium border-r sticky left-0 z-30 bg-muted/50 flex-shrink-0 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.2)]"
                  style={{ width: LEFT_COL_WIDTH }}
                >
                  Client
                </div>
                {viewType === 'weekly' ? (
                  columnHeaders.map((header, idx) => (
                    <div 
                      key={idx}
                      className="p-1 text-xs text-center font-medium border-r last:border-r-0 flex-shrink-0 flex items-center justify-center"
                      style={{ width: SLOT_WIDTH }}
                      title={header.fullLabel}
                    >
                      {header.label}
                    </div>
                  ))
                ) : (
                  timeSlots.map(slot => (
                    <div 
                      key={slot}
                      className="p-1 text-xs text-center font-medium border-r last:border-r-0 flex-shrink-0 flex items-center justify-center"
                      style={{ width: SLOT_WIDTH }}
                    >
                      {slot}
                    </div>
                  ))
                )}
            </div>

            {/* Client rows */}
            {clientSchedule.map((client: any) => (
              <div 
                key={client.id}
                className="border-b last:border-b-0 flex hover:bg-muted/25 transition-colors"
                style={{ width: TOTAL_WIDTH }}
              >
                {/* Client info column */}
                <div 
                  className="p-3 border-r bg-background sticky left-0 z-10 flex-shrink-0 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.2)]"
                  style={{ width: LEFT_COL_WIDTH }}
                >
                  <div className="space-y-1">
                    <div className="font-medium text-sm truncate flex items-center gap-1.5">
                      <span className={client.status === 'Inactive' ? 'text-muted-foreground' : ''}>
                        {client.name}
                      </span>
                      {client.status === 'Inactive' && (
                        <Badge 
                          variant="outline" 
                          className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border-muted-foreground/30 flex-shrink-0"
                        >
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {client.address || 'No address'}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {client.postcode || 'Postcode not available'}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>
                        {viewType === 'weekly' 
                          ? `${client.totalWeekHours?.toFixed(1) || '0.0'}h`
                          : `${client.totalCareHours?.toFixed(1) || '0.0'}h`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Render based on view type */}
                {viewType === 'weekly' ? (
                  // Weekly view: Show bookings grouped by day
                  columnHeaders.map((header, idx) => (
                    <div 
                      key={idx}
                      className="border-r last:border-r-0 p-2 min-h-[80px] flex-shrink-0 space-y-1"
                      style={{ width: SLOT_WIDTH }}
                    >
                      {(client.weekBookings[header.dateString] || []).map((booking: Booking) => {
                        const requestColors = getRequestStatusColors(booking);
                        const RequestIcon = requestColors.icon;
                        
                        // Use request colors if pending request, otherwise use booking status colors
                            const colorClasses = requestColors.hasRequest 
                              ? `${requestColors.background} ${requestColors.border} ${requestColors.text}`
                              : getBookingStatusColor(getEffectiveBookingStatus(booking), 'light');
                        
                        return (
                          <Tooltip key={booking.id}>
                            <TooltipTrigger asChild>
                              <div
                                className={`text-xs p-2 rounded cursor-pointer border relative ${colorClasses}`}
                                onClick={() => onViewBooking?.(booking)}
                              >
                                {/* Request indicator dot */}
                                {requestColors.hasRequest && (
                                  <div className="absolute top-1 right-1">
                                    <div className={`w-2 h-2 rounded-full ${requestColors.dotColor} animate-pulse`} />
                                  </div>
                                )}
                                
                                {/* Booking content */}
                                <div className="font-semibold">
                                  {(booking as any).allCarerNames?.length > 1 
                                    ? `${(booking as any).allCarerNames.length} Carers`
                                    : booking.carerName}
                                </div>
                                <div className="text-[10px] opacity-75">{booking.startTime} - {booking.endTime}</div>
                                
                                {/* Request icon */}
                                {requestColors.hasRequest && RequestIcon && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <RequestIcon className={`h-3 w-3 ${requestColors.iconColor}`} />
                                    <span className="text-[9px] font-medium">{requestColors.tooltip}</span>
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover text-popover-foreground border border-border shadow-lg p-3 rounded-md">
                              <div className="text-sm space-y-2">
                                {requestColors.hasRequest && (
                                  <div className="font-bold text-amber-700 dark:text-amber-400 mb-2 pb-2 border-b">
                                    ⚠️ {requestColors.tooltip}
                                  </div>
                                )}
                                
                                {/* Carer Assignment Section */}
                                <div>
                                  <span className="font-medium">
                                    {(booking as any).allCarerNames?.length > 1 ? 'Assigned Carers:' : 'Assigned Carer:'}
                                  </span>
                                  {!(booking as any).allCarerNames?.length && !booking.carerName ? (
                                    <span className="text-muted-foreground ml-1">Not assigned yet</span>
                                  ) : (booking as any).allCarerNames?.length > 1 ? (
                                    <ul className="mt-1 ml-4 list-disc space-y-0.5">
                                      {(booking as any).allCarerNames.map((name: string, idx: number) => (
                                        <li key={idx}>{name}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span className="ml-1">{(booking as any).allCarerNames?.[0] || booking.carerName}</span>
                                  )}
                                </div>
                                
                                <div><span className="font-medium">Time:</span> {booking.startTime} - {booking.endTime}</div>
                                <div><span className="font-medium">Status:</span> {booking.status}</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                      {(client.weekBookings[header.dateString] || []).length === 0 && (
                        <div className="text-xs text-muted-foreground text-center pt-6">No bookings</div>
                      )}
                    </div>
                  ))
                ) : enableDragDrop ? (
                  // Daily view with drag-and-drop enabled
                  <ClientScheduleDraggable
                    clientId={client.id}
                    clientName={client.name}
                    timeSlots={timeSlots}
                    schedule={client.schedule}
                    bookingBlocks={client.bookingBlocks}
                    slotWidth={SLOT_WIDTH}
                    onViewBooking={onViewBooking}
                    onCellClick={handleCellClick}
                    getStatusColor={getStatusColor}
                    renderTooltipContent={renderTooltipContent}
                    selectedBookings={selectedBookings}
                    onBookingSelect={onBookingSelect}
                  />
                ) : (
                  // Daily view: Time-based booking blocks (non-draggable)
                  <div className="relative flex">
                    {timeSlots.map(slot => {
                      const status = client.schedule[slot];
                      return (
                        <div
                          key={slot}
                          className={`
                            border-r last:border-r-0 flex-shrink-0 cursor-pointer transition-colors
                            ${status.type === 'available' ? 'bg-background border-border hover:bg-muted/50' : 'bg-transparent'}
                          `}
                          style={{ 
                            width: SLOT_WIDTH,
                            height: '80px'
                          }}
                          onClick={() => status.type === 'available' && handleCellClick(client.id, slot, status)}
                        />
                      );
                    })}
                    
                    {/* Booking blocks - absolutely positioned overlays */}
                    {client.bookingBlocks?.map((block: BookingBlock, idx: number) => {
                      const requestColors = getRequestStatusColors(block.booking);
                      const RequestIcon = requestColors.icon;
                      
                      // If there's a pending request, override the status color
                      const colorClass = requestColors.hasRequest 
                        ? `${requestColors.background} ${requestColors.text}` 
                        : getStatusColor({ type: block.status, booking: block.booking });
                      
                      const isSplitFirst = block.isSplit && block.splitType === 'first';
                      const isSplitSecond = block.isSplit && block.splitType === 'second';
                      const isSelected = selectedBookings.some(b => b.id === block.booking.id);
                      
                      return (
                        <Tooltip key={`${block.booking.id}-${idx}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                absolute top-0 h-full flex items-center justify-center text-xs font-medium cursor-pointer transition-all
                                border border-gray-300 dark:border-gray-600 rounded-sm
                                ${colorClass}
                                ${requestColors.hasRequest ? requestColors.border : ''}
                                ${isSplitFirst ? 'border-r-4 border-r-blue-600 border-dashed' : ''}
                                ${isSplitSecond ? 'border-l-4 border-l-blue-600 border-dashed' : ''}
                                ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}
                              `}
                              style={{ 
                                left: `${block.leftPosition + 1}px`,
                                width: `${Math.max(block.width - 2, 18)}px`,
                                height: '78px',
                                marginTop: '1px',
                                zIndex: isSelected ? 2 : 1
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onViewBooking) {
                                  onViewBooking(block.booking);
                                }
                              }}
                            >
                              {/* Selection checkbox */}
                              {onBookingSelect && (
                                <div 
                                  className="absolute top-1 left-1 z-10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onBookingSelect(block.booking, !isSelected);
                                  }}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    className="h-4 w-4 bg-background border-2"
                                  />
                                </div>
                              )}

                              {/* Request indicator - top right */}
                              {requestColors.hasRequest && (
                                <div className="absolute top-1 right-1 z-10">
                                  <div className={`w-2 h-2 rounded-full ${requestColors.dotColor} animate-pulse`} />
                                </div>
                              )}

                              {/* Notes indicator */}
                              {block.booking.notes && !requestColors.hasRequest && (
                                <div 
                                  className="absolute top-1 right-1 z-10 pointer-events-none"
                                  title="Has notes"
                                >
                                  <div className="bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                                    <StickyNote className="h-3 w-3" />
                                  </div>
                                </div>
                              )}

                              {/* Booking content */}
                              <div className="flex flex-col items-center justify-center px-1 w-full">
                                <div className="font-semibold truncate w-full text-center">
                                  {(block.booking as any).allCarerNames?.length > 1 
                                    ? `${(block.booking as any).allCarerNames.length} Carers`
                                    : block.booking.carerName}
                                </div>
                                <div className="text-[10px] opacity-75 flex items-center justify-center gap-1">
                                  {isSplitSecond && <span className="text-blue-600">←</span>}
                                  <span>{block.booking.startTime}-{block.booking.endTime}</span>
                                  {isSplitFirst && <span className="text-blue-600">→</span>}
                                </div>
                                
                                {/* Request icon indicator */}
                                {requestColors.hasRequest && RequestIcon && (
                                  <div className="flex items-center gap-0.5 mt-0.5">
                                    <RequestIcon className={`h-2.5 w-2.5 ${requestColors.iconColor}`} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm p-4 bg-popover text-popover-foreground border border-border shadow-lg rounded-md">
                            {requestColors.hasRequest && (
                              <div className="font-bold text-amber-700 dark:text-amber-400 mb-2 pb-2 border-b">
                                ⚠️ {requestColors.tooltip}
                              </div>
                            )}
                            {renderTooltipContent({ type: block.status, booking: block.booking }, client.name)}
                            {block.booking.splitIndicator === 'continues-next-day' && (
                              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                ⚠️ Continues to next day until {block.booking.originalEndTime}
                              </div>
                            )}
                            {block.booking.splitIndicator === 'continued-from-previous-day' && (
                              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                ⚠️ Started previous day at {block.booking.originalStartTime}
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          </div>
          {/* Summary - sticky footer inside scroll container */}
          <div className="flex items-center justify-between text-sm text-muted-foreground py-3 px-4 bg-muted/50 border-t flex-shrink-0">
            <div>
              Showing {clientSchedule.length} of {clients.length} clients
            </div>
            <div className="font-medium">
              Total scheduled hours: {clientSchedule.reduce((sum: number, client: any) => {
                if (viewType === 'weekly') {
                  return sum + (client.totalWeekHours || 0);
                }
                return sum + (client.totalCareHours || 0);
              }, 0).toFixed(1)}
            </div>
          </div>
        </div>
        </div>
        )}
      </div>
    </TooltipProvider>
  );
}