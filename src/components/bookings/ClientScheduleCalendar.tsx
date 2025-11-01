import React, { useState, useMemo } from "react";
import { format } from "date-fns";
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
  const SLOT_WIDTH = timeInterval === 60 ? 64 : 32; // 1-hour or 30-minute slot width
  const TOTAL_SLOTS = timeInterval === 60 ? 24 : 48; // 24 hours (1hr) or 48 (30min)
  const TOTAL_WIDTH = LEFT_COL_WIDTH + (SLOT_WIDTH * TOTAL_SLOTS);

  // Safe helper to get initials from a name
  const getInitials = (fullName?: string): string => {
    if (!fullName) return '';
    return fullName.split(' ').map(n => n[0] || '').join('').toUpperCase();
  };

  // Generate time slots based on interval
  const timeSlots = useMemo(() => {
    const slots = [];
    if (timeInterval === 60) {
      // 1-hour intervals: 00:00, 01:00, 02:00, ... 23:00
      for (let i = 0; i < 24; i++) {
        slots.push(`${i.toString().padStart(2, '0')}:00`);
      }
    } else {
      // 30-minute intervals: 00:00, 00:30, 01:00, 01:30, ...
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
        // Get exact start and end times including minutes
        const [startHour, startMin] = booking.startTime.split(':').map(Number);
        const [endHour, endMin] = booking.endTime.split(':').map(Number);
        
        // Calculate which slots this booking occupies
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const durationMinutes = endMinutes - startMinutes;
        
        // Determine booking status
        let statusType: ClientStatus['type'] = 'scheduled';
        if (booking.status === 'departed') statusType = 'in-progress';
        else if (booking.status === 'done') statusType = 'completed';
        else if (booking.status === 'cancelled') statusType = 'cancelled';
        
        // Calculate position for continuous booking block
        const { left, width } = calculateBookingPosition(startMinutes, durationMinutes);
        
        // Add to booking blocks for rendering
        bookingBlocks.push({
          booking,
          startMinutes,
          durationMinutes,
          leftPosition: left,
          width,
          status: statusType
        });
        
        // Mark all occupied slots based on timeInterval (for empty cell detection)
        timeSlots.forEach(slot => {
          const [slotHour, slotMin] = slot.split(':').map(Number);
          const slotMinutes = slotHour * 60 + slotMin;
          const nextSlotMinutes = slotMinutes + timeInterval;
          
          // Check if this slot overlaps with the booking
          if (startMinutes < nextSlotMinutes && endMinutes > slotMinutes) {
            schedule[slot] = {
              type: statusType,
              booking
            };
          }
        });

        // Calculate hours more accurately
        totalCareHours += durationMinutes / 60;
      });

      return {
        id: client.id,
        name: client.name,
        address: 'Address not available', // Client interface doesn't have address
        carePackage: 'Standard Care', // Default care package
        schedule,
        bookingBlocks,
        totalCareHours,
        contractedHours: 8 // TODO: Get from client profile when available
      };
    });

    // Apply filters
    let filteredData = scheduleData;

    // Filter based on search term
    if (searchTerm) {
      filteredData = filteredData.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply functional filters
    if (!filters.showAll) {
      // Hide clients with no bookings
      filteredData = filteredData.filter(client => client.totalCareHours > 0);
    }

    if (filters.activeOnly) {
      // Show only clients with active care sessions
      filteredData = filteredData.filter(client => 
        Object.values(client.schedule).some(status => status.type === 'in-progress')
      );
    }

    if (filters.scheduledOnly) {
      // Show only clients with scheduled appointments
      filteredData = filteredData.filter(client => client.totalCareHours > 0);
    }

    return filteredData;
  }, [clients, bookings, date, timeSlots, searchTerm, filters]);

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

        {/* Header with search and filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showAll" 
                  checked={filters.showAll}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, showAll: checked as boolean }))
                  }
                />
                <label htmlFor="showAll" className="text-sm">Show All Clients</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="activeOnly" 
                  checked={filters.activeOnly}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, activeOnly: checked as boolean }))
                  }
                />
                <label htmlFor="activeOnly" className="text-sm">Active Sessions Only</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="scheduledOnly" 
                  checked={filters.scheduledOnly}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, scheduledOnly: checked as boolean }))
                  }
                />
                <label htmlFor="scheduledOnly" className="text-sm">Scheduled Only</label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
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

        {/* Schedule Grid */}
        <div className="border rounded-lg overflow-x-auto">
          <div className="text-xs text-muted-foreground mb-2 px-1">← Scroll horizontally to see more time slots</div>
          <div style={{ width: TOTAL_WIDTH }}>
            {/* Header row with time slots */}
            <div 
              className="bg-muted/50 border-b flex"
              style={{ width: TOTAL_WIDTH }}
            >
              <div 
                className="p-3 font-medium border-r sticky left-0 z-10 bg-muted/50 flex-shrink-0"
                style={{ width: LEFT_COL_WIDTH }}
              >
                Client
              </div>
              {timeSlots.map(slot => (
                <div 
                  key={slot} 
                  className="p-1 text-xs text-center font-medium border-r last:border-r-0 flex-shrink-0 flex items-center justify-center"
                  style={{ width: SLOT_WIDTH }}
                >
                  {slot}
                </div>
              ))}
            </div>

            {/* Client rows */}
            {clientSchedule.map((client) => (
              <div 
                key={client.id}
                className="border-b last:border-b-0 flex hover:bg-muted/25 transition-colors"
                style={{ width: TOTAL_WIDTH }}
              >
                {/* Client info column */}
                <div 
                  className="p-3 border-r bg-background sticky left-0 z-10 flex-shrink-0"
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
                      <span>{client.totalCareHours.toFixed(1)}h / {client.contractedHours}h</span>
                    </div>
                  </div>
                </div>

                {/* Time slot cells - background grid for empty slots */}
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
                  {client.bookingBlocks.map((block, idx) => {
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
                              width: `${Math.max(block.width, 20)}px`, // Minimum 20px width
                              height: '80px',
                              zIndex: 1
                            }}
                            onClick={() => onViewBooking && onViewBooking(block.booking)}
                          >
                            <span className="truncate px-1">
                              {getInitials(block.booking.carerName)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {renderTooltipContent({ type: block.status, booking: block.booking }, client.name)}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {clientSchedule.length} of {clients.length} clients
          </div>
          <div>
            Total scheduled hours: {clientSchedule.reduce((sum, client) => sum + client.totalCareHours, 0).toFixed(1)}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}