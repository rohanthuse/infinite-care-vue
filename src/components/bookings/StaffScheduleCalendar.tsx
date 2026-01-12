import React, { useState, useMemo } from "react";
import { formatHoursToReadable } from "@/lib/utils";
import { format, isToday, startOfDay, addHours, isSameHour, startOfWeek, addDays } from "date-fns";
import { Search, Filter, Users, Clock, MapPin, PoundSterling, Download, Target, XCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBranchStaff } from "@/hooks/useBranchStaff";
import { useLeaveRequests, useAnnualLeave, AnnualLeave } from "@/hooks/useLeaveManagement";
import { useStaffUtilizationAnalytics, useEnhancedStaffSchedule } from "@/hooks/useStaffUtilizationAnalytics";
import { useStaffScheduleEvents, StaffTrainingEvent, StaffAppointmentEvent } from "@/hooks/useStaffScheduleEvents";
import { useStaffWorkingHours } from "@/hooks/useStaffWorkingHours";
import { StaffWorkingHoursDialog } from "@/components/staff/StaffWorkingHoursDialog";
import { useTenant } from "@/contexts/TenantContext";
import { isHolidayOnDate, getHolidayForStaff } from "@/utils/holidayHelpers";
import { extractPostcodeFromAddress } from "@/utils/postcodeUtils";
import { DateNavigation } from "./DateNavigation";
import { BookingFilters } from "./BookingFilters";
import { StaffUtilizationMetrics } from "./StaffUtilizationMetrics";
import { Booking, Client, Carer } from "./BookingTimeGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingsMonthView } from "./BookingsMonthView";
import { getBookingStatusColor, getBookingStatusLabel, getEffectiveBookingStatus } from "./utils/bookingColors";
import { StaffScheduleDraggable } from "./StaffScheduleDraggable";
import { getRequestStatusColors } from "./utils/requestIndicatorHelpers";

interface StaffScheduleCalendarProps {
  date: Date;
  bookings: Booking[];
  branchId?: string;
  onCreateBooking?: (staffId: string, timeSlot: string) => void;
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
  enableDragDrop?: boolean;
  selectedBookings?: Booking[];
  onBookingSelect?: (booking: Booking, selected: boolean) => void;
}

interface StaffStatus {
  type: 'assigned' | 'in-progress' | 'done' | 'leave' | 'unavailable' | 'available' | 'holiday';
  booking?: Booking;
  leaveType?: string;
  holidayName?: string;
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
  status: StaffStatus['type'];
  isSplit?: boolean;
  splitType?: 'first' | 'second';
}

interface StaffScheduleRow {
  id: string;
  name: string;
  email?: string;
  specialization?: string;
  address?: string;
  postcode?: string;
  schedule: Record<string, StaffStatus>;
  bookingBlocks: BookingBlock[];
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
  selectedClientIds = [],
  selectedCarerIds = [],
  selectedStatus,
  viewType = "daily",
  onClientChange,
  onCarerChange,
  onStatusChange,
  hideControls = false,
  timeInterval = 30,
  enableDragDrop = false,
  selectedBookings = [],
  onBookingSelect,
}: StaffScheduleCalendarProps) {
  const { organization } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    showRuns: true,
    maxHours: false,
    travelTime: true,
    assignedOnly: false,
  });
  const [workingHoursDialogOpen, setWorkingHoursDialogOpen] = useState(false);
  const [selectedStaffForHours, setSelectedStaffForHours] = useState<{
    id: string;
    name: string;
  } | null>(null);

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
  const SLOT_WIDTH = viewType === 'weekly' ? 120 : (timeInterval === 60 ? 64 : 32);
  const TOTAL_SLOTS = viewType === 'weekly' ? 7 : (timeInterval === 60 ? 24 : 48);
  const TOTAL_WIDTH = LEFT_COL_WIDTH + (SLOT_WIDTH * TOTAL_SLOTS);

  // Fetch staff and leave data
  const { data: staff = [], isLoading: isLoadingStaff } = useBranchStaff(branchId || '');
  const { data: leaveRequests = [], isLoading: isLoadingLeave } = useLeaveRequests(branchId);
  const { data: holidays = [], isLoading: isLoadingHolidays } = useAnnualLeave(branchId);
  
  // Fetch enhanced utilization data
  const { data: utilizationData = [], isLoading: isLoadingUtilization } = useStaffUtilizationAnalytics(branchId, date);
  
  // Enhanced staff schedule with utilization metrics
  const enhancedStaffData = useEnhancedStaffSchedule(staff, bookings, date);
  
  // Get staff IDs for event fetching
  const staffIds = useMemo(() => staff.map(s => s.id), [staff]);
  
  // Fetch training and appointment events
  const { data: staffEvents = [] } = useStaffScheduleEvents(
    branchId,
    date,
    staffIds
  );

  // Fetch working hours for all staff on selected date
  const { data: workingHours = [] } = useStaffWorkingHours(branchId || '', date, staffIds);
  
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

  // Process staff schedule data
  const staffSchedule = useMemo(() => {
    if (viewType === 'weekly') {
      // Weekly view data structure
      const scheduleData = staff
        .filter(member => {
          // Filter by selected carers if any
          if (selectedCarerIds && selectedCarerIds.length > 0) {
            return selectedCarerIds.includes(member.id);
          }
          return true;
        })
        .map(member => {
        const weekBookings: Record<string, Booking[]> = {};
        const weekLeave: Record<string, any> = {};
        const weekHolidays: Record<string, AnnualLeave | null> = {};
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        
        // Initialize each weekday
        for (let i = 0; i < 7; i++) {
          const dayDate = format(addDays(weekStart, i), 'yyyy-MM-dd');
          weekBookings[dayDate] = [];
          
          // Check for approved leave on this day
          const dayLeave = leaveRequests.find(leave => 
            leave.staff_id === member.id &&
            leave.status === 'approved' &&
            leave.start_date <= dayDate &&
            leave.end_date >= dayDate
          );
          weekLeave[dayDate] = dayLeave || null;
          
          // Check for holidays on this day that apply to THIS staff member
          // (either their own carer-specific holiday OR a branch-wide holiday)
          const dayOfWeek = addDays(weekStart, i);
          const dayHoliday = getHolidayForStaff(holidays, dayOfWeek, member.id);
          weekHolidays[dayDate] = dayHoliday || null;
        }
        
        // Group bookings by day
        const staffBookings = bookings.filter(b => b.carerId === member.id);
        
        // Filter to only bookings within this week's date range for accurate weekly total
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');
        const weeklyStaffBookings = staffBookings.filter(b => 
          b.date >= weekStartStr && b.date <= weekEndStr
        );
        
        weeklyStaffBookings.forEach(booking => {
          if (weekBookings[booking.date]) {
            weekBookings[booking.date].push(booking);
          }
        });
        
        // Calculate total hours for the week using only this week's bookings
        const totalWeekHours = weeklyStaffBookings.reduce((sum, b) => {
          const [startH, startM] = b.startTime.split(':').map(Number);
          const [endH, endM] = b.endTime.split(':').map(Number);
          let durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
          // Handle midnight crossing
          if (durationMinutes < 0) {
            durationMinutes += 1440; // Add 24 hours
          }
          const duration = durationMinutes / 60;
          return sum + duration;
        }, 0);
        
      return {
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        email: member.email,
        specialization: member.specialization,
        address: member.address,
        postcode: member.postcode || extractPostcodeFromAddress(member.address),
        weekBookings,
        weekLeave,
        weekHolidays,
        totalWeekHours,
        contractedHours: 40
      };
      });
      
      // Apply filters
      let filteredData = scheduleData;
      if (searchTerm) {
        filteredData = filteredData.filter(staff => 
          staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (staff.specialization && staff.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      if (!filters.showRuns) {
        filteredData = filteredData.filter(staff => staff.totalWeekHours > 0);
      }
      return filteredData;
    } else {
      // Daily view logic
      const scheduleData: StaffScheduleRow[] = staff
        .filter(member => {
          // Filter by selected carers if any
          if (selectedCarerIds && selectedCarerIds.length > 0) {
            return selectedCarerIds.includes(member.id);
          }
          return true;
        })
        .map(member => {
        const schedule: Record<string, StaffStatus> = {};
        const bookingBlocks: BookingBlock[] = [];
        let totalHours = 0;
        
        // Initialize all time slots as available
        timeSlots.forEach(slot => {
          schedule[slot] = { type: 'available' };
        });

        // Mark time slots outside working hours as unavailable (off-shift)
        const staffWorkHours = workingHours.find(wh => wh.staff_id === member.id);
        
        if (staffWorkHours) {
          // Staff has defined working hours - mark everything else as unavailable
          const [workStartHour, workStartMin] = staffWorkHours.start_time.split(':').map(Number);
          const [workEndHour, workEndMin] = staffWorkHours.end_time.split(':').map(Number);
          
          const workStartMinutes = workStartHour * 60 + workStartMin;
          const workEndMinutes = workEndHour * 60 + workEndMin;
          
          timeSlots.forEach(slot => {
            const [slotHour, slotMin] = slot.split(':').map(Number);
            const slotMinutes = slotHour * 60 + slotMin;
            
            // Mark as off-shift if slot is outside working hours
            if (slotMinutes < workStartMinutes || slotMinutes >= workEndMinutes) {
              schedule[slot] = { 
                type: 'unavailable',
                leaveType: 'off-shift'
              };
            }
          });
        }

        // Add bookings for this staff member on this date
        const dayBookings = bookings.filter(booking => 
          booking.carerId === member.id && 
          booking.date === format(date, 'yyyy-MM-dd')
        );

        dayBookings.forEach(booking => {
          const [startHour, startMin] = booking.startTime.split(':').map(Number);
          const [endHour, endMin] = booking.endTime.split(':').map(Number);
          
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          
          // Detect midnight crossing BEFORE we adjust duration
          const crossesMidnight = endMinutes < startMinutes;
          
          let statusType: StaffStatus['type'] = 'assigned'; // default
          switch (booking.status) {
            case 'assigned':
              statusType = 'assigned';
              break;
            case 'unassigned':
              statusType = 'assigned'; // Show as assigned but will use unassigned color
              break;
            case 'done':
              statusType = 'done';
              break;
            case 'in-progress':
            case 'departed':
              statusType = 'in-progress';
              break;
            case 'cancelled':
              statusType = 'done'; // Map to done type but use cancelled color
              break;
            case 'suspended':
              statusType = 'unavailable';
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
            totalHours += minutesUntilMidnight / 60;
            
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
            
            totalHours += durationMinutes / 60;
          }
        });

        // Check for bookings from previous day that cross into current day
        const previousDayDate = format(addDays(date, -1), 'yyyy-MM-dd');
        const previousDayBookings = bookings.filter(booking => 
          booking.carerId === member.id && 
          booking.date === previousDayDate
        );

        previousDayBookings.forEach(booking => {
          const [startHour, startMin] = booking.startTime.split(':').map(Number);
          const [endHour, endMin] = booking.endTime.split(':').map(Number);
          
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          
          // If end time is less than start time, it crosses midnight
          if (endMinutes < startMinutes) {
            let statusType: StaffStatus['type'] = 'assigned';
            switch (booking.status) {
              case 'assigned':
                statusType = 'assigned';
                break;
              case 'unassigned':
                statusType = 'assigned';
                break;
              case 'done':
                statusType = 'done';
                break;
              case 'in-progress':
              case 'departed':
                statusType = 'in-progress';
                break;
              case 'cancelled':
                statusType = 'done';
                break;
              case 'suspended':
                statusType = 'unavailable';
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
            
            totalHours += endMinutes / 60;
          }
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
          timeSlots.forEach(slot => {
            if (schedule[slot].type === 'available') {
              schedule[slot] = {
                type: 'leave',
                leaveType: todayLeave.leave_type
              };
            }
          });
        }

        // Check for holidays on this day that apply to THIS staff member
        // Holidays are informational - staff can still be booked (with override)
        const todayHoliday = getHolidayForStaff(holidays, date, member.id);
        if (todayHoliday) {
          timeSlots.forEach(slot => {
            // Only mark as holiday if slot is currently available (not leave, not booked)
            if (schedule[slot].type === 'available') {
              schedule[slot] = {
                type: 'holiday',
                holidayName: todayHoliday.leave_name
              };
            }
          });
        }

        // Add training events
        staffEvents
          .filter(event => event.type === 'training' && event.staff_id === member.id)
          .forEach(event => {
            const trainingEvent = event as StaffTrainingEvent;
            
            // Parse time from training_notes or use defaults (9 AM - 5 PM)
            const timeMatch = trainingEvent.training_notes?.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
            
            let startHour = 9, startMin = 0, endHour = 17, endMin = 0;
            if (timeMatch) {
              startHour = Number(timeMatch[1]);
              startMin = Number(timeMatch[2]);
              endHour = Number(timeMatch[3]);
              endMin = Number(timeMatch[4]);
            }
            
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const durationMinutes = endMinutes - startMinutes;
            
            const { left, width } = calculateBookingPosition(startMinutes, durationMinutes);
            
            bookingBlocks.push({
              booking: {
                id: trainingEvent.id,
                clientId: '',
                clientName: trainingEvent.training_courses.title,
                clientInitials: 'TR',
                carerId: member.id,
                carerName: `${member.first_name} ${member.last_name}`,
                carerInitials: getInitials(`${member.first_name} ${member.last_name}`),
                startTime: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
                endTime: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
                date: format(date, 'yyyy-MM-dd'),
                status: 'training' as any,
                notes: trainingEvent.training_notes || undefined,
              },
              startMinutes,
              durationMinutes,
              leftPosition: left,
              width,
              status: 'unavailable'
            });
            
            // Mark time slots as unavailable
            timeSlots.forEach(slot => {
              const [slotHour, slotMin] = slot.split(':').map(Number);
              const slotMinutes = slotHour * 60 + slotMin;
              const nextSlotMinutes = slotMinutes + timeInterval;
              
              if (startMinutes < nextSlotMinutes && endMinutes > slotMinutes) {
                schedule[slot] = {
                  type: 'unavailable',
                  booking: bookingBlocks[bookingBlocks.length - 1].booking
                };
              }
            });
          });

        // Add appointment events
        staffEvents
          .filter(event => event.type === 'appointment' && event.staff_id === member.id)
          .forEach(event => {
            const appointmentEvent = event as StaffAppointmentEvent;
            
            // Parse appointment time
            const [timeHour, timeMin] = appointmentEvent.appointment_time.split(':').map(Number);
            const startMinutes = timeHour * 60 + timeMin;
            const durationMinutes = 60; // Default 1 hour duration
            const endMinutes = startMinutes + durationMinutes;
            
            const endHour = Math.floor(endMinutes / 60);
            const endMin = endMinutes % 60;
            
            const { left, width } = calculateBookingPosition(startMinutes, durationMinutes);
            
            bookingBlocks.push({
              booking: {
                id: appointmentEvent.id,
                clientId: '',
                clientName: `${appointmentEvent.appointment_type} - ${appointmentEvent.provider_name}`,
                clientInitials: 'MT',
                carerId: member.id,
                carerName: `${member.first_name} ${member.last_name}`,
                carerInitials: getInitials(`${member.first_name} ${member.last_name}`),
                startTime: appointmentEvent.appointment_time,
                endTime: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
                date: appointmentEvent.appointment_date,
                status: 'meeting' as any,
                notes: appointmentEvent.notes || undefined,
              },
              startMinutes,
              durationMinutes,
              leftPosition: left,
              width,
              status: 'unavailable'
            });
            
            // Mark time slots as unavailable
            timeSlots.forEach(slot => {
              const [slotHour, slotMin] = slot.split(':').map(Number);
              const slotMinutes = slotHour * 60 + slotMin;
              const nextSlotMinutes = slotMinutes + timeInterval;
              
              if (startMinutes < nextSlotMinutes && endMinutes > slotMinutes) {
                schedule[slot] = {
                  type: 'unavailable',
                  booking: bookingBlocks[bookingBlocks.length - 1].booking
                };
              }
            });
          });

        return {
          id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          email: member.email,
          specialization: member.specialization,
          address: member.address,
          postcode: member.postcode || extractPostcodeFromAddress(member.address),
          schedule,
          bookingBlocks,
          totalHours,
          contractedHours: 8
        };
      });

      // Apply filters
      let filteredData = scheduleData;
      if (searchTerm) {
        filteredData = filteredData.filter(staff => 
          staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (staff.specialization && staff.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      if (!filters.showRuns) {
        filteredData = filteredData.filter(staff => staff.totalHours > 0);
      }
      if (filters.maxHours) {
        filteredData = filteredData.filter(staff => staff.totalHours <= staff.contractedHours);
      }
      if (filters.assignedOnly) {
        filteredData = filteredData.filter(staff => staff.totalHours > 0);
      }
      return filteredData;
    }
  }, [viewType, staff, bookings, date, leaveRequests, timeSlots, searchTerm, filters, timeInterval, staffEvents]);

  const getStatusColor = (status: StaffStatus) => {
    // Handle off-shift status
    if (status.type === 'unavailable' && status.leaveType === 'off-shift') {
      return getBookingStatusColor('off-shift', 'light');
    }

    // If there's a booking, use effective status for color (considers late/missed)
    if (status.booking) {
      const effectiveStatus = getEffectiveBookingStatus(status.booking);
      return getBookingStatusColor(effectiveStatus, 'light');
    }
    
    // Default colors for status types
    switch (status.type) {
      case 'assigned':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'in-progress':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'done':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'leave':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'holiday':
        return 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100';
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
      case 'holiday':
        return 'H';
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
    } else if (status.type === 'holiday' && onCreateBooking) {
      // Allow override of holiday with confirmation
      if (window.confirm(`This carer has a holiday (${status.holidayName}) on this date. Do you still want to create a booking?`)) {
        onCreateBooking(staffId, timeSlot);
      }
    }
  };

  const renderTooltipContent = (status: StaffStatus, staffName: string, onClickViewDetails?: () => void) => {
    if (status.type === 'unavailable' && status.leaveType === 'off-shift') {
      return (
        <div className="space-y-1">
          <p className="font-medium">{staffName}</p>
          <p className="text-sm text-muted-foreground">Off-shift (not working)</p>
        </div>
      );
    }

    if (status.type === 'available') {
      return (
        <div className="space-y-1">
          <p className="font-medium">{staffName}</p>
          <p className="text-sm text-muted-foreground">Available - Click to create booking</p>
        </div>
      );
    }

    if (status.type === 'holiday') {
      return (
        <div className="space-y-1">
          <p className="font-medium">{staffName}</p>
          <p className="text-sm text-purple-600">🎄 Holiday: {status.holidayName}</p>
          <p className="text-xs text-muted-foreground">Click to create booking (override holiday)</p>
        </div>
      );
    }
    
    if (status.booking) {
      const effectiveStatus = getEffectiveBookingStatus(status.booking);
      const statusLabel = getBookingStatusLabel(effectiveStatus);
      const statusColor = getBookingStatusColor(effectiveStatus, 'light');
      
      // Special handling for training/meeting entries - no "Click to view details"
      const bookingStatus = (status.booking as any).status;
      const isTrainingOrMeeting = bookingStatus === 'training' || bookingStatus === 'meeting';
      
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium">{staffName}</p>
            <Badge variant="custom" className={statusColor}>
              {statusLabel}
            </Badge>
          </div>
      <div className="space-y-1 text-sm">
        {/* Use appropriate label based on entry type */}
        {bookingStatus === 'training' ? (
          <p><span className="font-medium">Training:</span> {status.booking.clientName}</p>
        ) : bookingStatus === 'meeting' ? (
          <p><span className="font-medium">Meeting:</span> {status.booking.clientName}</p>
        ) : (
          <p><span className="font-medium">Client:</span> {status.booking.clientName}</p>
        )}
        <p><span className="font-medium">Time:</span> {status.booking.startTime} - {status.booking.endTime}</p>
            {status.booking.notes && (
              <p><span className="font-medium">Notes:</span> {status.booking.notes}</p>
            )}
          </div>
          {/* Only show "Click to view details" for regular appointments */}
          {onClickViewDetails && !isTrainingOrMeeting && (
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
          {/* Show informational text for training/meeting entries */}
          {isTrainingOrMeeting && (
            <p className="text-xs text-muted-foreground pt-1 border-t border-muted mt-2">
              {bookingStatus === 'training' 
                ? 'Training period - no appointment details' 
                : 'External meeting - no appointment details'}
            </p>
          )}
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
      <div className="h-full">
      <Tabs defaultValue="schedule" className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedule">Staff Schedule</TabsTrigger>
          <TabsTrigger value="utilization">Utilization Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6 h-full flex flex-col">
          <div className="flex flex-col gap-4 h-full">
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
                    placeholder="Search staff..."
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
                      id="showRuns" 
                      checked={filters.showRuns}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, showRuns: checked as boolean }))
                      }
                    />
                    <label htmlFor="showRuns" className="text-sm whitespace-nowrap">Show All Staff</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="maxHours" 
                      checked={filters.maxHours}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, maxHours: checked as boolean }))
                      }
                    />
                    <label htmlFor="maxHours" className="text-sm whitespace-nowrap">Within Max Hours</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="assignedOnly" 
                      checked={filters.assignedOnly}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ ...prev, assignedOnly: checked as boolean }))
                      }
                    />
                    <label htmlFor="assignedOnly" className="text-sm whitespace-nowrap">Assigned Only</label>
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
                <div className="flex flex-wrap items-center gap-4 text-sm">
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
                    <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-800 font-bold text-xs">
                      H
                    </div>
                    <span>Holiday</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-300 flex items-center justify-center text-red-800 font-bold text-xs">
                      A
                    </div>
                    <span>Leave (A=Annual, S=Sick, P=Personal, M=Maternity, PT=Paternity, E=Emergency)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
                    <span>Unavailable</span>
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
          leaveRequests={leaveRequests}
          holidays={holidays}
          isLoading={false}
          onBookingClick={onViewBooking}
          onCreateBooking={(date, time, clientId, carerId) => {
            if (carerId && onCreateBooking) {
              onCreateBooking(carerId, time);
            }
          }}
        />
        </ScrollArea>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col" style={{ gap: 0 }}>
        <div className="schedule-scroll border rounded-lg flex flex-col flex-1 min-h-0 max-w-full overflow-hidden" style={{ gap: 0 }}>
          <div className="text-xs text-muted-foreground py-2 px-3 bg-muted/30 border-b flex-shrink-0">
            ← Scroll horizontally to see more {viewType === 'weekly' ? 'days' : 'time slots'} →
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            <div className="time-grid-inner" style={{ width: TOTAL_WIDTH }}>
            {/* Header row - sticky */}
            <div 
              className="bg-muted/50 border-b flex sticky top-0 z-20"
              style={{ width: TOTAL_WIDTH }}
            >
              <div 
                className="p-3 font-medium border-r sticky left-0 z-30 bg-muted/50 flex-shrink-0 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.2)]"
                style={{ width: LEFT_COL_WIDTH }}
              >
                Staff
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

            {/* Staff rows */}
            {staffSchedule.map((staffMember: any) => (
              <div 
                key={staffMember.id} 
                className="border-b last:border-b-0 flex"
                style={{ 
                  width: TOTAL_WIDTH,
                  minHeight: '80px',
                  margin: 0,
                  padding: 0
                }}
              >
                {/* Staff info column */}
                <div 
                  className="p-3 border-r bg-background sticky left-0 z-10 flex-shrink-0 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.2)]"
                  style={{ width: LEFT_COL_WIDTH }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm">{staffMember.name}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStaffForHours({
                          id: staffMember.id,
                          name: staffMember.name
                        });
                        setWorkingHoursDialogOpen(true);
                      }}
                      className="h-6 w-6 p-0"
                      title="Set working hours"
                    >
                      <Clock className="h-3 w-3" />
                    </Button>
                  </div>
                  {staffMember.specialization && (
                    <div className="text-xs text-muted-foreground">{staffMember.specialization}</div>
                  )}
                  <div className="text-xs text-muted-foreground flex items-center gap-1 truncate" title={staffMember.address || 'No address'}>
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{staffMember.postcode || extractPostcodeFromAddress(staffMember.address) || 'Not provided'}</span>
                  </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatHoursToReadable(
                              viewType === 'weekly' 
                                ? (staffMember.totalWeekHours || 0)
                                : (staffMember.totalHours || 0)
                            )}
                          </div>
                </div>

                {/* Render based on view type */}
                {viewType === 'weekly' ? (
                  // Weekly view: Show bookings grouped by day
                  columnHeaders.map((header, idx) => (
                    <div 
                      key={idx}
                      className="border-r last:border-r-0 p-2 min-h-[64px] flex-shrink-0 space-y-1"
                      style={{ width: SLOT_WIDTH }}
                    >
                      {/* Show holiday indicator (FIRST - at the very top) */}
                      {staffMember.weekHolidays && staffMember.weekHolidays[header.dateString] && (
                        <div className="mb-1 p-1.5 rounded bg-purple-100 border border-purple-300 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs font-semibold text-purple-800 bg-white rounded-full w-4 h-4 flex items-center justify-center">
                              H
                            </span>
                            <span className="text-[9px] text-purple-700 truncate">
                              {staffMember.weekHolidays[header.dateString].leave_name}
                            </span>
                          </div>
                          {staffMember.weekHolidays[header.dateString].is_company_wide && (
                            <div className="text-[8px] text-purple-600 mt-0.5">Company-wide</div>
                          )}
                        </div>
                      )}
                      
                      {/* Show leave indicator if staff is on leave */}
                      {staffMember.weekLeave && staffMember.weekLeave[header.dateString] && (
                        <div className="mb-2 p-2 rounded bg-red-100 border border-red-300 text-center">
                          <div className="text-xs font-semibold text-red-800">
                            {staffMember.weekLeave[header.dateString].leave_type === 'annual' ? 'A' :
                             staffMember.weekLeave[header.dateString].leave_type === 'sick' ? 'S' :
                             staffMember.weekLeave[header.dateString].leave_type === 'personal' ? 'P' :
                             staffMember.weekLeave[header.dateString].leave_type === 'maternity' ? 'M' :
                             staffMember.weekLeave[header.dateString].leave_type === 'paternity' ? 'PT' :
                             staffMember.weekLeave[header.dateString].leave_type === 'emergency' ? 'E' : 'L'}
                          </div>
                          <div className="text-[9px] text-red-700 mt-0.5">
                            {staffMember.weekLeave[header.dateString].leave_type.charAt(0).toUpperCase() + 
                             staffMember.weekLeave[header.dateString].leave_type.slice(1)} Leave
                          </div>
                        </div>
                      )}
                      
                      {/* Show bookings */}
                      {(staffMember.weekBookings[header.dateString] || []).map((booking: Booking) => {
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
                                
                                <div className="font-semibold">{booking.clientName}</div>
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
                            <TooltipContent>
                              <div className="text-sm space-y-1">
                                {requestColors.hasRequest && (
                                  <div className={`font-bold ${requestColors.iconColor} mb-2`}>
                                    ⚠️ {requestColors.tooltip}
                                  </div>
                                )}
                                <div><strong>Client:</strong> {booking.clientName}</div>
                                <div><strong>Time:</strong> {booking.startTime} - {booking.endTime}</div>
                                <div><strong>Status:</strong> {booking.status}</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                      
                       {/* Show "Available" if no bookings and no leave (holiday days show override option) */}
                      {(staffMember.weekBookings[header.dateString] || []).length === 0 && 
                       (!staffMember.weekLeave || !staffMember.weekLeave[header.dateString]) && (
                        <>
                          {staffMember.weekHolidays?.[header.dateString] ? (
                            <div 
                              className="text-xs text-purple-600 text-center pt-2 cursor-pointer hover:underline"
                              onClick={() => {
                                if (onCreateBooking) {
                                  const holidayName = staffMember.weekHolidays[header.dateString]?.leave_name || 'Holiday';
                                  if (window.confirm(`${staffMember.name} has a holiday (${holidayName}) on this date. Do you still want to create a booking?`)) {
                                    onCreateBooking(staffMember.id, '09:00');
                                  }
                                }
                              }}
                            >
                              + Add Booking
                            </div>
                          ) : (
                            <div 
                              className="text-xs text-muted-foreground text-center pt-4 cursor-pointer hover:text-primary"
                              onClick={() => onCreateBooking?.(staffMember.id, '09:00')}
                            >
                              Available
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                ) : enableDragDrop ? (
                  // Daily view with drag-and-drop enabled
                  <StaffScheduleDraggable
                    staffId={staffMember.id}
                    staffName={staffMember.name}
                    timeSlots={timeSlots}
                    schedule={staffMember.schedule}
                    bookingBlocks={staffMember.bookingBlocks}
                    slotWidth={SLOT_WIDTH}
                    onViewBooking={onViewBooking}
                    onCellClick={handleCellClick}
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
                    renderTooltipContent={renderTooltipContent}
                    selectedBookings={selectedBookings}
                    onBookingSelect={onBookingSelect}
                  />
                ) : (
                  // Daily view: Time-based booking blocks (standard)
                  <div className="relative flex">
                    {timeSlots.map(slot => {
                      const status = staffMember.schedule[slot];
                      return (
                        <div
                          key={slot}
                          className={`
                            border-r last:border-r-0 flex-shrink-0 cursor-pointer transition-colors
                            ${status.type === 'available' ? 'bg-white border-gray-200 hover:bg-gray-50' : 
                              status.type === 'leave' ? getStatusColor(status) : 
                              status.type === 'holiday' ? getStatusColor(status) : 'bg-transparent'}
                          `}
                          style={{ 
                            width: SLOT_WIDTH,
                            height: '64px'
                          }}
                          onClick={() => (status.type === 'available' || status.type === 'leave' || status.type === 'holiday') && handleCellClick(staffMember.id, slot, status)}
                        >
                          {status.type === 'leave' && (
                            <div className="flex items-center justify-center h-full text-xs font-medium">
                              {getStatusLabel(status)}
                            </div>
                          )}
                          {status.type === 'holiday' && (
                            <div className="flex items-center justify-center h-full text-xs font-medium text-purple-700">
                              H
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Booking blocks - absolutely positioned overlays */}
                    {staffMember.bookingBlocks?.map((block: BookingBlock, idx: number) => {
                      const requestColors = getRequestStatusColors(block.booking);
                      const RequestIcon = requestColors.icon;
                      
                      // If there's a pending request, override the status color
                      const colorClass = requestColors.hasRequest 
                        ? `${requestColors.background} ${requestColors.text}` 
                        : getStatusColor({ type: block.status, booking: block.booking });
                      
                      const isSplitFirst = block.isSplit && block.splitType === 'first';
                      const isSplitSecond = block.isSplit && block.splitType === 'second';
                      
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
                              `}
                              style={{ 
                                left: `${block.leftPosition}px`,
                                width: `${Math.max(block.width, 20)}px`,
                                height: '64px',
                                zIndex: 1
                              }}
                              onClick={() => onViewBooking && onViewBooking(block.booking)}
                            >
                              {/* Request indicator - top right */}
                              {requestColors.hasRequest && (
                                <div className="absolute top-1 right-1 z-10">
                                  <div className={`w-2 h-2 rounded-full ${requestColors.dotColor} animate-pulse`} />
                                </div>
                              )}
                              
                              <div className="flex flex-col items-center justify-center px-1 w-full">
                                <div className="font-semibold truncate w-full text-center">
                                  {block.booking.clientName}
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
                          <TooltipContent side="top" className="max-w-sm p-4 bg-popover text-popover-foreground border border-border shadow-lg rounded-md">
                            {requestColors.hasRequest && (
                              <div className={`font-bold ${requestColors.iconColor} mb-2 pb-2 border-b`}>
                                ⚠️ {requestColors.tooltip}
                              </div>
                            )}
                            {renderTooltipContent({ type: block.status, booking: block.booking }, staffMember.name)}
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
        </div>
        </div>
      )}

      {/* Enhanced Summary footer with utilization metrics */}
      {staffSchedule.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{staffSchedule.length} Staff</p>
                  <p className="text-xs text-muted-foreground">Active {viewType === 'weekly' ? 'this week' : 'today'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {formatHoursToReadable(staffSchedule.reduce((acc: number, staff: any) => {
                      if (viewType === 'weekly') {
                        return acc + (staff.totalWeekHours || 0);
                      }
                      return acc + (staff.totalHours || 0);
                    }, 0))}
                  </p>
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

        <TabsContent value="utilization" className="mt-6 h-full flex flex-col">
          {isLoadingUtilization ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading utilization data...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-8">
              <StaffUtilizationMetrics 
                staffData={utilizationData} 
                date={date} 
                branchId={branchId} 
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Working Hours Dialog */}
      {selectedStaffForHours && organization && (
        <StaffWorkingHoursDialog
          open={workingHoursDialogOpen}
          onOpenChange={setWorkingHoursDialogOpen}
          staffId={selectedStaffForHours.id}
          staffName={selectedStaffForHours.name}
          branchId={branchId || ''}
          organizationId={organization.id}
          initialDate={date}
        />
      )}
      </div>
    </TooltipProvider>
  );
}