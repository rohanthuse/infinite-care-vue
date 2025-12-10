import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ConflictingBooking {
  id: string;
  clientName: string;
  startTime: string;
  endTime: string;
  date: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  conflictingBookings: ConflictingBooking[];
  availableCarers?: Array<{ id: string; name: string; initials: string }>;
}

/**
 * Consolidated validation hook that replaces all other validation systems.
 * This is the single source of truth for booking overlap validation.
 */
export function useConsolidatedValidation(branchId?: string) {
  const [isValidating, setIsValidating] = useState(false);

  const validateBooking = useCallback(async (
    carerId: string,
    startTime: string,
    endTime: string,
    date: string,
    excludeBookingIds?: string | string[],
    availableCarers?: Array<{ id: string; name: string; initials: string }>
  ): Promise<ValidationResult> => {
      // Normalize excludeBookingIds to array
      const excludeIds = excludeBookingIds 
        ? (Array.isArray(excludeBookingIds) ? excludeBookingIds : [excludeBookingIds])
        : [];

      console.log("[useConsolidatedValidation] Starting validation:", {
        carerId,
        startTime,
        endTime,
        date,
        excludeBookingIds: excludeIds,
        branchId,
        timestamp: new Date().toISOString()
      });

    // Input validation
    if (!branchId || !carerId || !startTime || !endTime || !date) {
      return {
        isValid: false,
        error: "Missing required validation parameters",
        conflictingBookings: []
      };
    }

    setIsValidating(true);

    try {
      // Create timestamps using the user's local timezone context
      // The times passed in are already in local time (HH:mm format)
      // We need to create UTC timestamps for database comparison
      const localStartDate = new Date(`${date}T${startTime}:00`);
      const localEndDate = new Date(`${date}T${endTime}:00`);
      
      // Convert to ISO strings (which will be in UTC)
      const startTimestamp = localStartDate.toISOString();
      const endTimestamp = localEndDate.toISOString();
      
      console.log("[useConsolidatedValidation] Time conversion:", {
        input: { date, startTime, endTime },
        localStart: localStartDate.toString(),
        localEnd: localEndDate.toString(),
        utcStart: startTimestamp,
        utcEnd: endTimestamp
      });

      // Query for existing bookings for this carer on this date
      // Use the date portion of the start timestamp to filter
      const dateStart = startTimestamp.split('T')[0];
      let query = supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          end_time,
          branch_id,
          staff_id,
          status,
          clients!inner(first_name, last_name)
        `)
        .eq("branch_id", branchId)
        .eq("staff_id", carerId)
        .gte("start_time", `${dateStart}T00:00:00Z`)
        .lt("start_time", `${dateStart}T23:59:59Z`);

      // CRITICAL: Exclude ALL related booking records (for multi-staff appointments)
      if (excludeIds.length > 0) {
        // Use not.in for multiple IDs
        for (const excludeId of excludeIds) {
          query = query.neq("id", excludeId);
        }
        console.log("[useConsolidatedValidation] Excluding bookings:", excludeIds);
      }

      const { data: existingBookings, error } = await query;

      if (error) {
        console.error("[useConsolidatedValidation] Database error:", error);
        throw new Error(`Database validation failed: ${error.message}`);
      }

      console.log("[useConsolidatedValidation] Database query completed:", {
        foundBookings: existingBookings?.length || 0,
        queryParams: {
          branchId,
          staffId: carerId,
          dateFilter: `${dateStart}T00:00:00Z to ${dateStart}T23:59:59Z`,
          excludeBookingIds: excludeIds
        }
      });

      // Log each booking found for debugging
      if (existingBookings && existingBookings.length > 0) {
        console.log("[useConsolidatedValidation] Existing bookings details:");
        existingBookings.forEach((booking: any, index: number) => {
          console.log(`  [${index + 1}] Booking ${booking.id}:`, {
            startTime: booking.start_time,
            endTime: booking.end_time,
            staffId: booking.staff_id,
            branchId: booking.branch_id,
            clientName: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : 'Unknown',
            status: booking.status
          });
        });
      }

      // Check for time overlaps using actual Date objects (already in UTC)
      const proposedStart = localStartDate;
      const proposedEnd = localEndDate;
      
      const conflicts = (existingBookings || []).filter((booking: any) => {
        const existingStart = new Date(booking.start_time);
        const existingEnd = new Date(booking.end_time);

        // Strict overlap detection: any time intersection is blocked
        // Two intervals overlap if: start1 < end2 AND end1 > start2
        const hasOverlap = proposedStart.getTime() < existingEnd.getTime() && 
                           proposedEnd.getTime() > existingStart.getTime();
        
        console.log("[useConsolidatedValidation] Overlap check for booking:", {
          bookingId: booking.id,
          clientName: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : 'Unknown',
          existing: {
            start: existingStart.toISOString(),
            end: existingEnd.toISOString(),
            localTime: `${existingStart.getHours()}:${existingStart.getMinutes().toString().padStart(2, '0')} - ${existingEnd.getHours()}:${existingEnd.getMinutes().toString().padStart(2, '0')}`
          },
          proposed: {
            start: proposedStart.toISOString(), 
            end: proposedEnd.toISOString(),
            localTime: `${proposedStart.getHours()}:${proposedStart.getMinutes().toString().padStart(2, '0')} - ${proposedEnd.getHours()}:${proposedEnd.getMinutes().toString().padStart(2, '0')}`
          },
          hasOverlap
        });

        return hasOverlap;
      });

      // Helper function to extract time consistently
      const extractTime = (isoString: string) => {
        const timePart = isoString?.split('T')[1]?.split(/[+\-Z]/)[0];
        return timePart?.substring(0, 5) || "07:00";
      };

      const extractDate = (isoString: string) => isoString?.split('T')[0] || "";

      const conflictingBookings: ConflictingBooking[] = conflicts.map((booking: any) => ({
        id: booking.id,
        clientName: booking.clients ? 
          `${booking.clients.first_name} ${booking.clients.last_name}` : 
          "Unknown Client",
        startTime: extractTime(booking.start_time),
        endTime: extractTime(booking.end_time),
        date: extractDate(booking.start_time)
      }));

      // Find available carers if provided
      let availableCarersForSlot: Array<{ id: string; name: string; initials: string }> = [];
      if (availableCarers && conflicts.length > 0) {
        // Check each carer for availability at this time slot
        for (const carer of availableCarers) {
          if (carer.id === carerId) continue; // Skip the current carer
          
          const carerQuery = supabase
            .from("bookings")
            .select("id")
            .eq("branch_id", branchId)
            .eq("staff_id", carer.id)
            .gte("start_time", `${date}T00:00:00+00:00`)
            .lt("start_time", `${date}T23:59:59+00:00`);

          const { data: carerBookings } = await carerQuery;
          
          const hasConflict = (carerBookings || []).some((booking: any) => {
            const existingStart = new Date(booking.start_time);
            const existingEnd = new Date(booking.end_time);
            const proposedStart = new Date(startTimestamp);
            const proposedEnd = new Date(endTimestamp);
            
            return proposedStart < existingEnd && proposedEnd > existingStart;
          });
          
          if (!hasConflict) {
            availableCarersForSlot.push(carer);
          }
        }
      }

      const result: ValidationResult = {
        isValid: conflicts.length === 0,
        conflictingBookings,
        availableCarers: availableCarersForSlot
      };

      if (!result.isValid && conflicts.length > 0) {
        const firstConflict = conflicts[0];
        // Find the original booking to get status information
        const originalBooking = existingBookings?.find(b => b.id === firstConflict.id);
        const clientName = firstConflict.clients ? 
          `${firstConflict.clients.first_name} ${firstConflict.clients.last_name}` : 
          'another client';
        
        result.error = `This carer is already assigned to ${clientName} from ${extractTime(originalBooking?.start_time || '')} to ${extractTime(originalBooking?.end_time || '')} on ${extractDate(originalBooking?.start_time || '')}. Current booking status: ${originalBooking?.status || 'unknown'}`;
      }

      console.log("[useConsolidatedValidation] === FINAL VALIDATION RESULT ===");
      console.log("[useConsolidatedValidation] Validation result:", {
        isValid: result.isValid,
        conflictCount: result.conflictingBookings.length,
        error: result.error,
        hasAvailableCarers: result.availableCarers ? result.availableCarers.length : 0,
        timestamp: new Date().toISOString()
      });

      // Log conflict details for debugging
      if (result.conflictingBookings.length > 0) {
        console.log("[useConsolidatedValidation] CONFLICT DETAILS:");
        result.conflictingBookings.forEach((conflict, index) => {
          console.log(`  Conflict ${index + 1}:`, {
            id: conflict.id,
            clientName: conflict.clientName,
            timeSlot: `${conflict.startTime} - ${conflict.endTime}`,
            date: conflict.date
          });
        });
      } else {
        console.log("[useConsolidatedValidation] ✅ NO CONFLICTS FOUND - CARER IS AVAILABLE");
      }

      return result;

    } catch (error) {
      console.error("[useConsolidatedValidation] Validation error:", error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Unknown validation error",
        conflictingBookings: []
      };
    } finally {
      setIsValidating(false);
    }
  }, [branchId]);

  return {
    validateBooking,
    isValidating
  };
}