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
    excludeBookingId?: string,
    availableCarers?: Array<{ id: string; name: string; initials: string }>
  ): Promise<ValidationResult> => {
    console.log("[useConsolidatedValidation] Starting validation:", {
      carerId,
      startTime,
      endTime,
      date,
      excludeBookingId,
      branchId
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
      // Create precise timestamps in UTC
      const startTimestamp = `${date}T${startTime}:00+00:00`;
      const endTimestamp = `${date}T${endTime}:00+00:00`;

      // Query for existing bookings for this carer on this date
      let query = supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          end_time,
          branch_id,
          staff_id,
          clients!inner(first_name, last_name)
        `)
        .eq("branch_id", branchId)
        .eq("staff_id", carerId)
        .gte("start_time", `${date}T00:00:00+00:00`)
        .lt("start_time", `${date}T23:59:59+00:00`);

      // CRITICAL: Exclude the booking being edited
      if (excludeBookingId) {
        query = query.neq("id", excludeBookingId);
        console.log("[useConsolidatedValidation] Excluding booking:", excludeBookingId);
      }

      const { data: existingBookings, error } = await query;

      if (error) {
        console.error("[useConsolidatedValidation] Database error:", error);
        throw new Error(`Database validation failed: ${error.message}`);
      }

      console.log("[useConsolidatedValidation] Found existing bookings:", existingBookings?.length || 0);

      // Check for time overlaps
      const conflicts = (existingBookings || []).filter((booking: any) => {
        const existingStart = new Date(booking.start_time);
        const existingEnd = new Date(booking.end_time);
        const proposedStart = new Date(startTimestamp);
        const proposedEnd = new Date(endTimestamp);

        // Strict overlap detection: any time intersection is blocked
        const hasOverlap = proposedStart < existingEnd && proposedEnd > existingStart;
        
        if (hasOverlap) {
          console.log("[useConsolidatedValidation] Conflict detected:", {
            bookingId: booking.id,
            clientName: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : 'Unknown',
            existing: `${existingStart.toISOString()} - ${existingEnd.toISOString()}`,
            proposed: `${proposedStart.toISOString()} - ${proposedEnd.toISOString()}`
          });
        }

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
        const clientName = firstConflict.clients ? 
          `${firstConflict.clients.first_name} ${firstConflict.clients.last_name}` : 
          'another client';
        
        result.error = `This carer is already assigned to ${clientName} from ${extractTime(firstConflict.start_time)} to ${extractTime(firstConflict.end_time)} on ${extractDate(firstConflict.start_time)}`;
      }

      console.log("[useConsolidatedValidation] Validation result:", {
        isValid: result.isValid,
        conflictCount: result.conflictingBookings.length,
        error: result.error
      });

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