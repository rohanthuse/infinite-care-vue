
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  conflictingBookings?: Array<{
    id: string;
    clientName: string;
    startTime: string;
    endTime: string;
  }>;
}

export function useEnhancedOverlapValidation(branchId?: string) {
  const [isValidating, setIsValidating] = useState(false);

  const validateBooking = useCallback(async (
    carerId: string,
    startTime: string,
    endTime: string,
    date: string,
    excludeBookingId?: string
  ): Promise<ValidationResult> => {
    console.log("[useEnhancedOverlapValidation] 🔍 Starting enhanced validation");
    
    if (!branchId || !carerId || !startTime || !endTime || !date) {
      return { isValid: false, error: "Missing required validation parameters" };
    }

    setIsValidating(true);

    try {
      // Create precise timestamps
      const startTimestamp = `${date}T${startTime}:00+00:00`;
      const endTimestamp = `${date}T${endTime}:00+00:00`;

      console.log("[useEnhancedOverlapValidation] Validating:", {
        carerId,
        startTimestamp,
        endTimestamp,
        excludeBookingId
      });

      // Query database for overlapping bookings
      let query = supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          end_time,
          clients!inner(first_name, last_name)
        `)
        .eq("branch_id", branchId)
        .eq("staff_id", carerId)
        .gte("start_time", `${date}T00:00:00+00:00`)
        .lt("start_time", `${date}T23:59:59+00:00`);

      if (excludeBookingId) {
        query = query.neq("id", excludeBookingId);
      }

      const { data: existingBookings, error } = await query;

      if (error) {
        console.error("[useEnhancedOverlapValidation] Database error:", error);
        throw new Error(`Database validation failed: ${error.message}`);
      }

      // Check for overlaps with strict validation
      const conflicts = (existingBookings || []).filter((booking: any) => {
        const existingStart = new Date(booking.start_time);
        const existingEnd = new Date(booking.end_time);
        const proposedStart = new Date(startTimestamp);
        const proposedEnd = new Date(endTimestamp);

        // Strict overlap detection: any time intersection is blocked
        const hasOverlap = proposedStart < existingEnd && proposedEnd > existingStart;
        
        if (hasOverlap) {
          console.log("[useEnhancedOverlapValidation] ❌ Overlap detected:", {
            bookingId: booking.id,
            existing: `${existingStart.toISOString()} - ${existingEnd.toISOString()}`,
            proposed: `${proposedStart.toISOString()} - ${proposedEnd.toISOString()}`
          });
        }

        return hasOverlap;
      });

      const result: ValidationResult = {
        isValid: conflicts.length === 0,
        conflictingBookings: conflicts.map((booking: any) => ({
          id: booking.id,
          clientName: booking.clients ? 
            `${booking.clients.first_name} ${booking.clients.last_name}` : 
            "Unknown Client",
          startTime: new Date(booking.start_time).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          endTime: new Date(booking.end_time).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        }))
      };

        if (!result.isValid) {
        // Get the first conflicting booking for specific error message
        const firstConflict = conflicts[0];
        const conflictStart = format(new Date(firstConflict?.start_time), 'HH:mm');
        const conflictEnd = format(new Date(firstConflict?.end_time), 'HH:mm');
        
        result.error = `This carer is already assigned to ${firstConflict?.clients?.first_name || 'another client'} from ${conflictStart} to ${conflictEnd}`;
        console.log("[useEnhancedOverlapValidation] ❌ Validation failed:", result.error);
      } else {
        console.log("[useEnhancedOverlapValidation] ✅ Validation passed");
      }

      return result;

    } catch (error) {
      console.error("[useEnhancedOverlapValidation] Validation error:", error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Unknown validation error"
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
