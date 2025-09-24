
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

/**
 * @deprecated Use useConsolidatedValidation instead. This hook is no longer maintained.
 */
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
      // CRITICAL: Verify staff member belongs to the current branch first
      console.log("[useEnhancedOverlapValidation] Verifying staff belongs to branch:", {
        carerId,
        branchId
      });
      
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("id, first_name, last_name, branch_id")
        .eq("id", carerId)
        .eq("branch_id", branchId)
        .single();
      
      if (staffError || !staffData) {
        console.error("[useEnhancedOverlapValidation] Staff validation failed:", staffError);
        return { 
          isValid: false, 
          error: "Selected staff member does not belong to this branch or does not exist" 
        };
      }
      
      console.log("[useEnhancedOverlapValidation] ✅ Staff belongs to branch:", staffData.first_name, staffData.last_name);

      // Create precise timestamps
      const startTimestamp = `${date}T${startTime}:00+00:00`;
      const endTimestamp = `${date}T${endTime}:00+00:00`;

      console.log("[useEnhancedOverlapValidation] Validating:", {
        carerId,
        branchId,
        startTimestamp,
        endTimestamp,
        excludeBookingId
      });

      // Query database for overlapping bookings with STRICT branch filtering
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

      if (excludeBookingId) {
        query = query.neq("id", excludeBookingId);
      }

      const { data: existingBookings, error } = await query;

      if (error) {
        console.error("[useEnhancedOverlapValidation] Database error:", error);
        throw new Error(`Database validation failed: ${error.message}`);
      }

      console.log("[useEnhancedOverlapValidation] Found existing bookings:", existingBookings?.length || 0);
      
      // Additional safety check: Ensure all returned bookings are from the correct branch
      const validBookings = (existingBookings || []).filter((booking: any) => 
        booking.branch_id === branchId && booking.staff_id === carerId
      );
      
      if (validBookings.length !== (existingBookings || []).length) {
        console.warn("[useEnhancedOverlapValidation] ⚠️ Cross-branch data detected and filtered out");
      }

      // Check for overlaps with strict validation
      const conflicts = validBookings.filter((booking: any) => {
        const existingStart = new Date(booking.start_time);
        const existingEnd = new Date(booking.end_time);
        const proposedStart = new Date(startTimestamp);
        const proposedEnd = new Date(endTimestamp);

        // Strict overlap detection: any time intersection is blocked
        const hasOverlap = proposedStart < existingEnd && proposedEnd > existingStart;
        
        if (hasOverlap) {
          console.log("[useEnhancedOverlapValidation] ❌ Overlap detected:", {
            bookingId: booking.id,
            branchId: booking.branch_id,
            staffId: booking.staff_id,
            clientName: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : 'Unknown Client',
            existing: `${existingStart.toISOString()} - ${existingEnd.toISOString()}`,
            proposed: `${proposedStart.toISOString()} - ${proposedEnd.toISOString()}`
          });
        }

        return hasOverlap;
      });

      const result: ValidationResult = {
        isValid: conflicts.length === 0,
        conflictingBookings: conflicts.map((booking: any) => {
          // Use SAME direct string extraction as other components  
          const extractTime = (isoString: string) => {
            const timePart = isoString?.split('T')[1]?.split(/[+\-Z]/)[0];
            return timePart?.substring(0, 5) || "07:00";
          };
          
          return {
            id: booking.id,
            clientName: booking.clients ? 
              `${booking.clients.first_name} ${booking.clients.last_name}` : 
              "Unknown Client",
            startTime: extractTime(booking.start_time),
            endTime: extractTime(booking.end_time)
          };
        })
      };

        if (!result.isValid) {
        // Get the first conflicting booking for specific error message - use CONSISTENT extraction
        const firstConflict = conflicts[0];
        const extractTime = (isoString: string) => {
          const timePart = isoString?.split('T')[1]?.split(/[+\-Z]/)[0];
          return timePart?.substring(0, 5) || "07:00";
        };
        const extractDate = (isoString: string) => isoString?.split('T')[0] || "";
        
        const conflictStart = extractTime(firstConflict?.start_time);
        const conflictEnd = extractTime(firstConflict?.end_time);
        const conflictDate = extractDate(firstConflict?.start_time);
        
        // Ensure proper client name resolution
        const clientName = firstConflict?.clients ? 
          `${firstConflict.clients.first_name} ${firstConflict.clients.last_name}` : 
          'another client';
          
        result.error = `This carer is already assigned to ${clientName} from ${conflictStart} to ${conflictEnd} on ${conflictDate}`;
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
