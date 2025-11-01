import React, { useState, useMemo } from "react";
import { format, isToday, startOfDay, addHours, isSameHour } from "date-fns";
import { Search, Filter, Users, Clock, MapPin, PoundSterling, Download, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useBranchStaff } from "@/hooks/useBranchStaff";
import { useLeaveRequests } from "@/hooks/useLeaveManagement";
import { useStaffUtilizationAnalytics, useEnhancedStaffSchedule } from "@/hooks/useStaffUtilizationAnalytics";
import { DateNavigation } from "./DateNavigation";
import { BookingFilters } from "./BookingFilters";
import { StaffUtilizationMetrics } from "./StaffUtilizationMetrics";
import { Booking, Client, Carer } from "./BookingTimeGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StaffScheduleCalendarProps {
  date: Date;
  bookings: Booking[];
  branchId?: string;
  onCreateBooking?: (staffId: string, timeSlot: string) => void;
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

interface StaffStatus {
  type: 'assigned' | 'in-progress' | 'done' | 'leave' | 'unavailable' | 'available';
  booking?: Booking;
  leaveType?: string;
}

interface StaffScheduleRow {
  id: string;
  name: string;
  email?: string;
  specialization?: string;
  schedule: Record<string, StaffStatus>;
  totalHours: number;
  contractedHours: number;
}

export function StaffScheduleCalendar({ 
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
}: StaffScheduleCalendarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    showRuns: true,
    maxHours: true,
    travelTime: true,
    assignedOnly: false,
  });

  // Export functionality
  const handleExport = () => {
    const csvData = staffSchedule.map(staff => ({
      name: staff.name,
      specialization: staff.specialization || '',
      totalHours: staff.totalHours,
      contractedHours: staff.contractedHours,
      utilization: ((staff.totalHours / staff.contractedHours) * 100).toFixed(1) + '%'
    }));

    const csvContent = [
      ['Name', 'Specialization', 'Scheduled Hours', 'Contracted Hours', 'Utilization'],
      ...csvData.map(row => [row.name, row.specialization, row.totalHours, row.contractedHours, row.utilization])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff-schedule-${format(date, 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Layout constants for consistent width
  const LEFT_COL_WIDTH = 200; // Staff info column width
  const SLOT_WIDTH = timeInterval === 60 ? 64 : 32; // 1-hour or 30-minute slot width
  const TOTAL_SLOTS = timeInterval === 60 ? 24 : 48; // 24 hours (1hr) or 48 (30min)
  const TOTAL_WIDTH = LEFT_COL_WIDTH + (SLOT_WIDTH * TOTAL_SLOTS);

  // Fetch staff and leave data
  const { data: staff = [], isLoading: isLoadingStaff } = useBranchStaff(branchId || '');
  const { data: leaveRequests = [], isLoading: isLoadingLeave } = useLeaveRequests(branchId);
  
  // Fetch enhanced utilization data
  const { data: utilizationData = [], isLoading: isLoadingUtilization } = useStaffUtilizationAnalytics(branchId, date);
  
  // Enhanced staff schedule with utilization metrics
  const enhancedStaffData = useEnhancedStaffSchedule(staff, bookings, date);
  
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

  // Process staff schedule data
  const staffSchedule = useMemo(() => {
    const scheduleData: StaffScheduleRow[] = staff.map(member => {
      const schedule: Record<string, StaffStatus> = {};
      let totalHours = 0;
      
      // Initialize all time slots as available
      timeSlots.forEach(slot => {
        schedule[slot] = { type: 'available' };
      });

      // Add bookings for this staff member on this date
      const dayBookings = bookings.filter(booking => 
        booking.carerId === member.id && 
        booking.date === format(date, 'yyyy-MM-dd')
      );

      dayBookings.forEach(booking => {
        // Get exact start and end times including minutes
        const [startHour, startMin] = booking.startTime.split(':').map(Number);
        const [endHour, endMin] = booking.endTime.split(':').map(Number);
        
        // Calculate which 30-minute slots this booking occupies
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        // Mark all occupied 30-minute slots
        timeSlots.forEach(slot => {
          const [slotHour, slotMin] = slot.split(':').map(Number);
          const slotMinutes = slotHour * 60 + slotMin;
          const nextSlotMinutes = slotMinutes + 30;
          
          // Check if this 30-minute slot overlaps with the booking
          if (startMinutes < nextSlotMinutes && endMinutes > slotMinutes) {
            // Determine booking status
            let statusType: StaffStatus['type'] = 'assigned';
            if (booking.status === 'departed') statusType = 'in-progress';
            else if (booking.status === 'done') statusType = 'done';
            
            schedule[slot] = {
              type: statusType,
              booking
            };
          }
        });

        // Calculate hours more accurately
        totalHours += (endMinutes - startMinutes) / 60;
      });

      // Add leave periods
      const todayString = format(date, 'yyyy-MM-dd');
      const todayLeave = leaveRequests.find(leave => 
        leave.staff_id === member.id &&
        leave.status === 'approved' &&
        leave.start_date <= todayString &&
        leave.end_date >= todayString
      );

      if (todayLeave) {
        // Mark entire day as leave
        timeSlots.forEach(slot => {
          if (schedule[slot].type === 'available') {
            schedule[slot] = {
              type: 'leave',
              leaveType: todayLeave.leave_type
            };
          }
        });
      }

      return {
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        email: member.email,
        specialization: member.specialization,
        schedule,
        totalHours,
        contractedHours: 8 // TODO: Get from staff profile when available
      };
    });

    // Apply filters
    let filteredData = scheduleData;

    // Filter based on search term
    if (searchTerm) {
      filteredData = filteredData.filter(staff => 
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (staff.specialization && staff.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply functional filters
    if (!filters.showRuns) {
      // Hide staff with no bookings (runs)
      filteredData = filteredData.filter(staff => staff.totalHours > 0);
    }

    if (filters.maxHours) {
      // Show only staff who haven't exceeded contracted hours
      filteredData = filteredData.filter(staff => staff.totalHours <= staff.contractedHours);
    }

    if (filters.assignedOnly) {
      // Show only staff with assignments
      filteredData = filteredData.filter(staff => staff.totalHours > 0);
    }

    return filteredData;
  }, [staff, bookings, date, leaveRequests, timeSlots, searchTerm]);

  const getStatusColor = (status: StaffStatus) => {
    switch (status.type) {
      case 'assigned':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'in-progress':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'done':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'leave':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'unavailable':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-white border-gray-200 hover:bg-gray-50';
    }
  };

  const getStatusLabel = (status: StaffStatus) => {
    switch (status.type) {
      case 'assigned':
      case 'in-progress':
      case 'done':
        return getInitials(status.booking?.clientName);
      case 'leave':
        return status.leaveType?.charAt(0).toUpperCase() || 'L';
      case 'unavailable':
        return 'N/A';
      default:
        return '';
    }
  };

  const handleCellClick = (staffId: string, timeSlot: string, status: StaffStatus) => {
    // If there's a booking, view it; otherwise create a new one
    if (status.booking && onViewBooking) {
      onViewBooking(status.booking);
    } else if (status.type === 'available' && onCreateBooking) {
      onCreateBooking(staffId, timeSlot);
    }
  };

  const renderTooltipContent = (status: StaffStatus, staffName: string) => {
    if (status.type === 'available') {
      return (
        <div className="space-y-1">
          <p className="font-medium">{staffName}</p>
          <p className="text-sm text-muted-foreground">Available - Click to create booking</p>
        </div>
      );
    }
    
    if (status.booking) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium">{staffName}</p>
            <Badge className={getStatusColor(status).replace('border-', 'border-').replace('bg-', 'bg-').replace('text-', 'text-')}>
              {status.type}
            </Badge>
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Client:</span> {status.booking.clientName}</p>
            <p><span className="font-medium">Time:</span> {status.booking.startTime} - {status.booking.endTime}</p>
            {status.booking.notes && (
              <p><span className="font-medium">Notes:</span> {status.booking.notes}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Click to view details</p>
        </div>
      );
    }
    
    if (status.type === 'leave') {
      return (
        <div className="space-y-1">
          <p className="font-medium">{staffName}</p>
          <p className="text-sm text-muted-foreground">On {status.leaveType} leave</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-1">
        <p className="font-medium">{staffName}</p>
        <p className="text-sm text-muted-foreground">{status.type}</p>
      </div>
    );
  };

  // Loading state
  if (isLoadingStaff || isLoadingLeave) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!branchId || staff.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {!branchId ? 'No branch selected' : 'No staff found for this branch'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedule">Staff Schedule</TabsTrigger>
          <TabsTrigger value="utilization">Utilization Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6">
          <div className="space-y-4">
        {/* Date Navigation */}
        {!hideControls && onDateChange && (
          <DateNavigation
            currentDate={date}
            onDateChange={onDateChange}
            viewType="daily"
            onViewTypeChange={() => {}} // Not used in staff schedule
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
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showRuns" 
                  checked={filters.showRuns}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, showRuns: checked as boolean }))
                  }
                />
                <label htmlFor="showRuns" className="text-sm">Show All Staff</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="maxHours" 
                  checked={filters.maxHours}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, maxHours: checked as boolean }))
                  }
                />
                <label htmlFor="maxHours" className="text-sm">Within Max Hours</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="assignedOnly" 
                  checked={filters.assignedOnly}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, assignedOnly: checked as boolean }))
                  }
                />
                <label htmlFor="assignedOnly" className="text-sm">Assigned Only</label>
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
              <span>Assigned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
              <span>Done</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
              <span>Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
              <span>Unavailable</span>
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
            Staff
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

          {/* Staff rows */}
          {staffSchedule.map((staffMember) => (
            <div 
              key={staffMember.id} 
              className="border-b last:border-b-0 flex"
              style={{ width: TOTAL_WIDTH }}
            >
              {/* Staff info column */}
              <div 
                className="p-3 border-r bg-background sticky left-0 z-10 flex-shrink-0"
                style={{ width: LEFT_COL_WIDTH }}
              >
                <div className="font-medium text-sm">{staffMember.name}</div>
                {staffMember.specialization && (
                  <div className="text-xs text-muted-foreground">{staffMember.specialization}</div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {staffMember.totalHours}h / {staffMember.contractedHours}h
                  <span className={`ml-1 ${staffMember.totalHours > staffMember.contractedHours ? 'text-amber-600' : ''}`}>
                    ({((staffMember.totalHours / staffMember.contractedHours) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Time slot cells */}
              {timeSlots.map(slot => {
                const status = staffMember.schedule[slot];
                return (
                  <Tooltip key={`${staffMember.id}-${slot}-${status.type}`}>
                    <TooltipTrigger asChild>
                      <div
                        className={`p-0.5 border-r last:border-r-0 h-16 flex items-center justify-center text-xs font-medium cursor-pointer transition-colors flex-shrink-0 ${getStatusColor(status)}`}
                        style={{ width: SLOT_WIDTH }}
                        onClick={() => handleCellClick(staffMember.id, slot, status)}
                      >
                        {getStatusLabel(status)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm p-4 bg-popover text-popover-foreground border border-border shadow-lg rounded-md">
                      {renderTooltipContent(status, staffMember.name)}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Summary footer with utilization metrics */}
      {staffSchedule.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{staffSchedule.length} Staff</p>
                  <p className="text-xs text-muted-foreground">Active today</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{staffSchedule.reduce((acc, staff) => acc + staff.totalHours, 0)} Hours</p>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{bookings.length} Bookings</p>
                  <p className="text-xs text-muted-foreground">Total visits</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PoundSterling className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">£{(bookings.length * 25).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Expected revenue</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {enhancedStaffData.length > 0 ? 
                      (enhancedStaffData.reduce((acc, staff) => acc + staff.utilizationRate, 0) / enhancedStaffData.length).toFixed(1) 
                      : '0'}%
                  </p>
                  <p className="text-xs text-muted-foreground">Avg utilization</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
        </TabsContent>

        <TabsContent value="utilization" className="mt-6">
          {isLoadingUtilization ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading utilization data...</p>
              </div>
            </div>
          ) : (
            <StaffUtilizationMetrics 
              staffData={utilizationData} 
              date={date} 
              branchId={branchId} 
            />
          )}
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}