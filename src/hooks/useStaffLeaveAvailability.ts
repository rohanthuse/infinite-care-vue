import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isWithinInterval, isSameDay } from "date-fns";

export interface StaffLeaveInfo {
  leaveType: string;
  startDate: string;
  endDate: string;
  formattedRange: string;
}

export interface StaffLeaveStatus {
  staffId: string;
  isOnLeave: boolean;
  leaveInfo?: StaffLeaveInfo;
}

export interface ApprovedLeaveRequest {
  id: string;
  staff_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface RecurringLeaveConflict {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  leaveInfo: StaffLeaveInfo;
}

export interface RecurringLeaveValidationResult {
  hasConflicts: boolean;
  conflictingDates: RecurringLeaveConflict[];
  nonConflictingDates: string[];
  totalDates: number;
  conflictCount: number;
  carerId: string;
  carerName: string;
  leaveInfo?: StaffLeaveInfo;
}

/**
 * Hook to fetch approved leave requests for a branch
 */
export function useApprovedLeaveRequests(branchId?: string) {
  return useQuery({
    queryKey: ['approved-leave-requests', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      
      const { data, error } = await supabase
        .from('staff_leave_requests')
        .select('id, staff_id, leave_type, start_date, end_date, status')
        .eq('branch_id', branchId)
        .eq('status', 'approved');
      
      if (error) {
        console.error('[useApprovedLeaveRequests] Error fetching approved leaves:', error);
        throw error;
      }
      
      return (data || []) as ApprovedLeaveRequest[];
    },
    enabled: !!branchId,
    staleTime: 30000,
  });
}

/**
 * Check if a date falls within a leave period
 */
export function isDateWithinLeave(
  targetDate: Date,
  leaveStartDate: string,
  leaveEndDate: string
): boolean {
  try {
    const leaveStart = parseISO(leaveStartDate);
    const leaveEnd = parseISO(leaveEndDate);
    
    return isWithinInterval(targetDate, { start: leaveStart, end: leaveEnd }) ||
           isSameDay(targetDate, leaveStart) ||
           isSameDay(targetDate, leaveEnd);
  } catch (error) {
    console.error('[isDateWithinLeave] Error parsing dates:', error);
    return false;
  }
}

/**
 * Get leave info for a staff member on a specific date
 */
export function getStaffLeaveForDate(
  approvedLeaves: ApprovedLeaveRequest[],
  staffId: string,
  targetDate: Date
): StaffLeaveInfo | null {
  const staffLeaves = approvedLeaves.filter(leave => leave.staff_id === staffId);
  
  for (const leave of staffLeaves) {
    if (isDateWithinLeave(targetDate, leave.start_date, leave.end_date)) {
      const startDate = parseISO(leave.start_date);
      const endDate = parseISO(leave.end_date);
      
      return {
        leaveType: leave.leave_type,
        startDate: leave.start_date,
        endDate: leave.end_date,
        formattedRange: `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy')}`,
      };
    }
  }
  
  return null;
}

/**
 * Hook to check staff leave availability for a specific date
 */
export function useStaffLeaveAvailability(
  branchId?: string,
  targetDate?: Date | string
) {
  const { data: approvedLeaves = [], isLoading } = useApprovedLeaveRequests(branchId);
  
  const leaveStatusMap = useMemo(() => {
    const map = new Map<string, StaffLeaveStatus>();
    
    if (!targetDate || approvedLeaves.length === 0) {
      return map;
    }
    
    const dateToCheck = typeof targetDate === 'string' 
      ? parseISO(targetDate) 
      : targetDate;
    
    for (const leave of approvedLeaves) {
      if (isDateWithinLeave(dateToCheck, leave.start_date, leave.end_date)) {
        const startDate = parseISO(leave.start_date);
        const endDate = parseISO(leave.end_date);
        
        map.set(leave.staff_id, {
          staffId: leave.staff_id,
          isOnLeave: true,
          leaveInfo: {
            leaveType: leave.leave_type,
            startDate: leave.start_date,
            endDate: leave.end_date,
            formattedRange: `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy')}`,
          },
        });
      }
    }
    
    return map;
  }, [approvedLeaves, targetDate]);
  
  const isStaffOnLeave = (staffId: string): boolean => {
    return leaveStatusMap.get(staffId)?.isOnLeave ?? false;
  };
  
  const getLeaveInfo = (staffId: string): StaffLeaveInfo | undefined => {
    return leaveStatusMap.get(staffId)?.leaveInfo;
  };
  
  const staffOnLeaveIds = useMemo(() => {
    return Array.from(leaveStatusMap.keys());
  }, [leaveStatusMap]);
  
  return {
    leaveStatusMap,
    isStaffOnLeave,
    getLeaveInfo,
    staffOnLeaveIds,
    approvedLeaves,
    isLoading,
  };
}

/**
 * Validate if any selected carers are on leave for a booking date
 */
export function validateCarersLeaveConflict(
  selectedCarerIds: string[],
  approvedLeaves: ApprovedLeaveRequest[],
  bookingDate: Date,
  carerNames: Map<string, string>
): {
  hasConflict: boolean;
  conflictingCarers: Array<{
    id: string;
    name: string;
    leaveInfo: StaffLeaveInfo;
  }>;
  errorMessage?: string;
} {
  const conflictingCarers: Array<{
    id: string;
    name: string;
    leaveInfo: StaffLeaveInfo;
  }> = [];
  
  for (const carerId of selectedCarerIds) {
    const leaveInfo = getStaffLeaveForDate(approvedLeaves, carerId, bookingDate);
    
    if (leaveInfo) {
      conflictingCarers.push({
        id: carerId,
        name: carerNames.get(carerId) || 'Unknown Carer',
        leaveInfo,
      });
    }
  }
  
  if (conflictingCarers.length === 0) {
    return { hasConflict: false, conflictingCarers };
  }
  
  const firstConflict = conflictingCarers[0];
  const errorMessage = conflictingCarers.length === 1
    ? `${firstConflict.name} is on approved ${firstConflict.leaveInfo.leaveType} leave from ${firstConflict.leaveInfo.formattedRange} and cannot be assigned to this booking.`
    : `${conflictingCarers.length} selected carers are on leave during this date and cannot be assigned to this booking.`;
  
  return {
    hasConflict: true,
    conflictingCarers,
    errorMessage,
  };
}

/**
 * Validate recurring booking dates against staff leave
 * Returns detailed conflict information for each date
 */
export function validateRecurringBookingLeaveConflicts(
  carerId: string,
  carerName: string,
  bookingDates: string[],
  approvedLeaves: ApprovedLeaveRequest[]
): RecurringLeaveValidationResult {
  const conflictingDates: RecurringLeaveConflict[] = [];
  const nonConflictingDates: string[] = [];
  let leaveInfo: StaffLeaveInfo | undefined;
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (const dateStr of bookingDates) {
    const date = parseISO(dateStr);
    const staffLeave = getStaffLeaveForDate(approvedLeaves, carerId, date);
    
    if (staffLeave) {
      conflictingDates.push({
        date: dateStr,
        formattedDate: format(date, 'd MMM yyyy'),
        dayOfWeek: dayNames[date.getDay()],
        leaveInfo: staffLeave,
      });
      if (!leaveInfo) {
        leaveInfo = staffLeave;
      }
    } else {
      nonConflictingDates.push(dateStr);
    }
  }
  
  return {
    hasConflicts: conflictingDates.length > 0,
    conflictingDates,
    nonConflictingDates,
    totalDates: bookingDates.length,
    conflictCount: conflictingDates.length,
    carerId,
    carerName,
    leaveInfo,
  };
}
