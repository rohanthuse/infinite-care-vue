import React, { useState, useMemo } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { Search, Filter, Users, Clock, MapPin, PoundSterling, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { DateNavigation } from "./DateNavigation";
import { BookingFilters } from "./BookingFilters";
import { Booking, Client, Carer } from "./BookingTimeGrid";
import { BookingsMonthView } from "./BookingsMonthView";

interface ClientScheduleCalendarProps {
  date: Date;
  bookings: Booking[];
  branchId?: string;
  onCreateBooking?: (clientId: string, timeSlot: string) => void;
  onViewBooking?: (booking: Booking) => void;
  onDateChange?: (date: Date) => void;
  clients?: Client[];
  carers?: Carer[];
  selectedClient?: string;
  selectedCarer?: string;
  selectedStatus?: string;
  viewType?: "daily" | "weekly" | "monthly";
  onClientChange?: (clientId: string) => void;
  onCarerChange?: (carerId: string) => void;
  onStatusChange?: (status: string) => void;
  hideControls?: boolean;
  timeInterval?: 30 | 60;
}

interface ClientStatus {
  type: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'available';
  booking?: Booking;
}

interface BookingBlock {
  booking: Booking;
  startMinutes: number;
  durationMinutes: number;
  leftPosition: number;
  width: number;
  status: ClientStatus['type'];
}

interface ClientScheduleRow {
  id: string;
  name: string;
  address?: string;
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
  selectedClient,
  selectedCarer,
  selectedStatus,
  viewType = "daily",
  onClientChange,
  onCarerChange,
  onStatusChange,
  hideControls = false,
  timeInterval = 30,
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
    // Calculate position based on start time as fraction of time slots
    const slotsFromStart = startMinutes / timeInterval;
    const left = slotsFromStart * SLOT_WIDTH;
    
    // Calculate width based on duration
    const durationInSlots = durationMinutes / timeInterval;
    const width = durationInSlots * SLOT_WIDTH;
    
    return { left, width };
  };

  // Process client schedule data
  const clientSchedule = useMemo(() => {
    if (viewType === 'weekly') {
      // Weekly view data structure
      const scheduleData = clients.map(client => {
        const weekBookings: Record<string, Booking[]> = {};
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        
        // Initialize each weekday
        for (let i = 0; i < 7; i++) {
          const dayDate = format(addDays(weekStart, i), 'yyyy-MM-dd');
          weekBookings[dayDate] = [];
        }
        
        // Group bookings by day
        const clientBookings = bookings.filter(b => b.clientId === client.id);
        clientBookings.forEach(booking => {
          if (weekBookings[booking.date]) {
            weekBookings[booking.date].push(booking);
          }
        });
        
        // Calculate total hours for the week
        const totalWeekHours = clientBookings.reduce((sum, b) => {
          const [startH, startM] = b.startTime.split(':').map(Number);
          const [endH, endM] = b.endTime.split(':').map(Number);
          const duration = (endH * 60 + endM - startH * 60 - startM) / 60;
          return sum + duration;
        }, 0);
        
        return {
          id: client.id,
          name: client.name,
          address: 'Address not available',
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
      const scheduleData: ClientScheduleRow[] = clients.map(client => {
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

        dayBookings.forEach(booking => {
          const [startHour, startMin] = booking.startTime.split(':').map(Number);
          const [endHour, endMin] = booking.endTime.split(':').map(Number);
          
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          const durationMinutes = endMinutes - startMinutes;
          
          let statusType: ClientStatus['type'] = 'scheduled';
          if (booking.status === 'departed') statusType = 'in-progress';
          else if (booking.status === 'done') statusType = 'completed';
          else if (booking.status === 'cancelled') statusType = 'cancelled';
          
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

          totalCareHours += durationMinutes / 60;
        });

        return {
          id: client.id,
          name: client.name,
          address: 'Address not available',
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
    switch (status.type) {
      case 'scheduled':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'in-progress':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'cancelled':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-white border-gray-200 hover:bg-gray-50';
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

  const renderTooltipContent = (status: ClientStatus, clientName: string) => {
    if (status.type === 'available') {
      return (
        <div className="space-y-1">
          <p className="font-medium">{clientName}</p>
          <p className="text-sm text-muted-foreground">Available - Click to create booking</p>
        </div>
      );
    }
    
    if (status.booking) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium">{clientName}</p>
            <Badge className={getStatusColor(status).replace('border-', 'border-').replace('bg-', 'bg-').replace('text-', 'text-')}>
              {status.type}
            </Badge>
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Carer:</span> {status.booking.carerName}</p>
            <p><span className="font-medium">Time:</span> {status.booking.startTime} - {status.booking.endTime}</p>
            {status.booking.notes && (
              <p><span className="font-medium">Notes:</span> {status.booking.notes}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Click to view details</p>
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
      <div className="space-y-4">
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
            selectedClientId={selectedClient || "all-clients"}
            onClientChange={onClientChange || (() => {})}
            selectedCarerId={selectedCarer || "all-carers"}
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
                    <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
                    <span>Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
                    <span>In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
                    <span>Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
                    <span>Available</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Schedule Grid */}
        {viewType === 'monthly' ? (
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
        ) : (
        <div className="border rounded-lg flex flex-col h-full min-h-0">
          <div className="text-xs text-muted-foreground py-2 px-1 bg-background border-b">
            ← Scroll horizontally to see more {viewType === 'weekly' ? 'days' : 'time slots'} →
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 w-full">
            <div className="time-grid-inner" style={{ width: TOTAL_WIDTH, minWidth: TOTAL_WIDTH }}>
              {/* Header row - sticky */}
              <div className="bg-muted/50 border-b flex sticky top-0 z-20" style={{ width: TOTAL_WIDTH }}>
                <div 
                  className="p-3 font-medium border-r sticky left-0 z-30 bg-muted/50 flex-shrink-0"
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
                  className="p-3 border-r bg-background sticky left-0 z-10 flex-shrink-0 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                  style={{ width: LEFT_COL_WIDTH }}
                >
                  <div className="space-y-1">
                    <div className="font-medium text-sm truncate">
                      {client.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {client.address || 'No address'}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>
                        {viewType === 'weekly' 
                          ? `${client.totalWeekHours?.toFixed(1) || '0.0'}h / ${client.contractedHours}h`
                          : `${client.totalCareHours?.toFixed(1) || '0.0'}h / ${client.contractedHours}h`
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
                      {(client.weekBookings[header.dateString] || []).map((booking: Booking) => (
                        <Tooltip key={booking.id}>
                          <TooltipTrigger asChild>
                            <div
                              className="text-xs p-2 rounded cursor-pointer bg-blue-100 border-blue-300 text-blue-800 border"
                              onClick={() => onViewBooking?.(booking)}
                            >
                              <div className="font-semibold">{booking.carerName}</div>
                              <div className="text-[10px] opacity-75">{booking.startTime} - {booking.endTime}</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm space-y-1">
                              <div><strong>Staff:</strong> {booking.carerName}</div>
                              <div><strong>Time:</strong> {booking.startTime} - {booking.endTime}</div>
                              <div><strong>Status:</strong> {booking.status}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {(client.weekBookings[header.dateString] || []).length === 0 && (
                        <div className="text-xs text-muted-foreground text-center pt-6">No bookings</div>
                      )}
                    </div>
                  ))
                ) : (
                  // Daily view: Time-based booking blocks
                  <div className="relative flex">
                    {timeSlots.map(slot => {
                      const status = client.schedule[slot];
                      return (
                        <div
                          key={slot}
                          className={`
                            border-r last:border-r-0 flex-shrink-0 cursor-pointer transition-colors
                            ${status.type === 'available' ? 'bg-white border-gray-200 hover:bg-gray-50' : 'bg-transparent'}
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
                      const colorClass = getStatusColor({ type: block.status, booking: block.booking });
                      return (
                        <Tooltip key={`${block.booking.id}-${idx}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                absolute top-0 h-full flex items-center justify-center text-xs font-medium cursor-pointer transition-all
                                ${colorClass}
                              `}
                              style={{ 
                                left: `${block.leftPosition}px`,
                                width: `${Math.max(block.width, 20)}px`,
                                height: '80px',
                                zIndex: 1
                              }}
                              onClick={() => onViewBooking && onViewBooking(block.booking)}
                            >
                              <div className="flex flex-col items-center justify-center px-1 w-full">
                                <div className="font-semibold truncate w-full text-center">
                                  {block.booking.carerName}
                                </div>
                                <div className="text-[10px] opacity-75">
                                  {block.booking.startTime}-{block.booking.endTime}
                                </div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {renderTooltipContent({ type: block.status, booking: block.booking }, client.name)}
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
        </div>
        )}

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {clientSchedule.length} of {clients.length} clients
          </div>
          <div>
            Total scheduled hours: {clientSchedule.reduce((sum: number, client: any) => {
              if (viewType === 'weekly') {
                return sum + (client.totalWeekHours || 0);
              }
              return sum + (client.totalCareHours || 0);
            }, 0).toFixed(1)}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}