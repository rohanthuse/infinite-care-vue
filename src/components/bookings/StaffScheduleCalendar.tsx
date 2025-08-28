import React, { useState, useMemo } from "react";
import { format, isToday, startOfDay, addHours, isSameHour } from "date-fns";
import { Search, Filter, Users, Clock, MapPin, PoundSterling } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useBranchStaff } from "@/hooks/useBranchStaff";
import { useLeaveRequests } from "@/hooks/useLeaveManagement";
import { Booking } from "./BookingTimeGrid";

interface StaffScheduleCalendarProps {
  date: Date;
  bookings: Booking[];
  branchId?: string;
  onCreateBooking?: (staffId: string, timeSlot: string) => void;
  onViewBooking?: (booking: Booking) => void;
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
  onViewBooking
}: StaffScheduleCalendarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    showRuns: true,
    maxHours: true,
    travelTime: true,
    assignedOnly: false,
  });

  // Fetch staff and leave data
  const { data: staff = [], isLoading: isLoadingStaff } = useBranchStaff(branchId || '');
  const { data: leaveRequests = [], isLoading: isLoadingLeave } = useLeaveRequests(branchId);
  
  // Safe helper to get initials from a name
  const getInitials = (fullName?: string): string => {
    if (!fullName) return '';
    return fullName.split(' ').map(n => n[0] || '').join('').toUpperCase();
  };

  // Generate 30-minute time slots
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    return slots;
  }, []);

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
        contractedHours: 8 // Default - could be fetched from staff data
      };
    });

    // Filter based on search term
    if (searchTerm) {
      return scheduleData.filter(staff => 
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (staff.specialization && staff.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return scheduleData;
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
      <div className="space-y-4">
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
              <label htmlFor="showRuns" className="text-sm">Show Runs</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="maxHours" 
                checked={filters.maxHours}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, maxHours: checked as boolean }))
                }
              />
              <label htmlFor="maxHours" className="text-sm">Max Hours</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="travelTime" 
                checked={filters.travelTime}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, travelTime: checked as boolean }))
                }
              />
              <label htmlFor="travelTime" className="text-sm">Travel Time</label>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {format(date, 'EEEE, MMMM d, yyyy')}
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
        <div className="min-w-[1600px]">
        {/* Header row with time slots */}
        <div className="grid grid-cols-[200px_repeat(48,1fr)] bg-muted/50 border-b">
          <div className="p-3 font-medium border-r">Staff</div>
          {timeSlots.map(slot => (
            <div key={slot} className="p-1 text-xs text-center font-medium border-r last:border-r-0">
              {slot}
            </div>
          ))}
        </div>

          {/* Staff rows */}
          {staffSchedule.map((staffMember) => (
            <div key={staffMember.id} className="grid grid-cols-[200px_repeat(48,1fr)] border-b last:border-b-0">
              {/* Staff info column */}
              <div className="p-3 border-r bg-background">
                <div className="font-medium text-sm">{staffMember.name}</div>
                {staffMember.specialization && (
                  <div className="text-xs text-muted-foreground">{staffMember.specialization}</div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {staffMember.totalHours}h / {staffMember.contractedHours}h
                </div>
              </div>

              {/* Time slot cells */}
              {timeSlots.map(slot => {
                const status = staffMember.schedule[slot];
                return (
                  <Tooltip key={`${staffMember.id}-${slot}-${status.type}`}>
                    <TooltipTrigger asChild>
                      <div
                        className={`p-0.5 border-r last:border-r-0 h-16 flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${getStatusColor(status)}`}
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

      {/* Summary footer */}
      {staffSchedule.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{staffSchedule.length} Staff Members</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{staffSchedule.reduce((acc, staff) => acc + staff.totalHours, 0)} Total Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{bookings.length} Bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <PoundSterling className="h-4 w-4 text-muted-foreground" />
                <span>Revenue: £{(bookings.length * 25).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </TooltipProvider>
  );
}