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
    staleTime: 30000, // Cache for 30 seconds
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
    
    // Check if target date is within leave period (inclusive)
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
 * Returns a map of staffId -> leave status
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
    
    // Build leave status for each staff with approved leave
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
  
  /**
   * Check if a specific staff member is on leave for the target date
   */
  const isStaffOnLeave = (staffId: string): boolean => {
    return leaveStatusMap.get(staffId)?.isOnLeave ?? false;
  };
  
  /**
   * Get leave info for a specific staff member
   */
  const getLeaveInfo = (staffId: string): StaffLeaveInfo | undefined => {
    return leaveStatusMap.get(staffId)?.leaveInfo;
  };
  
  /**
   * Get all staff IDs who are on leave
   */
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
 * Returns validation result with details
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
