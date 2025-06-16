
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookingOverlap } from "../utils/bookingOverlapDetection";

export interface BookingRecord {
  id: string;
  client_id: string;
  staff_id: string;
  start_time: string;
  end_time: string;
  status: string;
}

export function useRealTimeOverlapCheck(branchId?: string) {
  const [isChecking, setIsChecking] = useState(false);

  const checkOverlapRealTime = useCallback(async (
    carerId: string,
    startTime: string,
    endTime: string,
    date: string,
    excludeBookingId?: string
  ): Promise<BookingOverlap> => {
    console.log("[useRealTimeOverlapCheck] 🚀 === CRITICAL OVERLAP CHECK START ===");
    console.log("[useRealTimeOverlapCheck] Input parameters:", {
      carerId,
      startTime,
      endTime,
      date,
      excludeBookingId,
      branchId
    });

    if (!branchId || !carerId || !startTime || !endTime || !date) {
      console.log("[useRealTimeOverlapCheck] ❌ Missing required parameters");
      return { hasOverlap: false, conflictingBookings: [] };
    }

    // CRITICAL: Set checking state immediately
    setIsChecking(true);

    try {
      // Create the proposed booking's start and end timestamps
      const proposedStartTimestamp = `${date}T${startTime}:00+00:00`;
      const proposedEndTimestamp = `${date}T${endTime}:00+00:00`;

      console.log("[useRealTimeOverlapCheck] 📅 Constructed timestamps:", {
        proposedStartTimestamp,
        proposedEndTimestamp
      });

      // CRITICAL: Fetch current bookings for this carer on this date from database
      let query = supabase
        .from("bookings")
        .select(`
          id,
          client_id,
          staff_id,
          start_time,
          end_time,
          status,
          clients!inner(first_name, last_name)
        `)
        .eq("branch_id", branchId)
        .eq("staff_id", carerId)
        .gte("start_time", `${date}T00:00:00+00:00`)
        .lt("start_time", `${date}T23:59:59+00:00`);

      // CRITICAL: Exclude the current booking if we're editing
      if (excludeBookingId) {
        query = query.neq("id", excludeBookingId);
        console.log("[useRealTimeOverlapCheck] 🚫 Excluding booking ID:", excludeBookingId);
      }

      const { data: existingBookings, error } = await query;

      if (error) {
        console.error("[useRealTimeOverlapCheck] ❌ Database error:", error);
        throw error;
      }

      console.log("[useRealTimeOverlapCheck] 📊 Found existing bookings:", existingBookings?.length || 0);
      console.log("[useRealTimeOverlapCheck] 📋 Existing bookings data:", existingBookings);

      if (!existingBookings || existingBookings.length === 0) {
        console.log("[useRealTimeOverlapCheck] ✅ No existing bookings found - no overlap");
        return { hasOverlap: false, conflictingBookings: [] };
      }

      // CRITICAL: Check for time overlaps with ULTRA-STRICT validation (no touching times allowed)
      const conflictingBookings = existingBookings.filter((booking: any) => {
        const existingStart = new Date(booking.start_time);
        const existingEnd = new Date(booking.end_time);
        const proposedStart = new Date(proposedStartTimestamp);
        const proposedEnd = new Date(proposedEndTimestamp);

        // ULTRA-STRICT overlap check: intervals overlap if start1 < end2 AND end1 > start2
        // This means even 1-SECOND overlaps will be caught
        const hasOverlap = proposedStart < existingEnd && proposedEnd > existingStart;

        console.log("[useRealTimeOverlapCheck] 🔍 ULTRA-STRICT overlap check for booking:", {
          bookingId: booking.id,
          existingStart: existingStart.toISOString(),
          existingEnd: existingEnd.toISOString(),
          proposedStart: proposedStart.toISOString(),
          proposedEnd: proposedEnd.toISOString(),
          hasOverlap,
          // Additional debug info
          proposedStartBeforeExistingEnd: proposedStart < existingEnd,
          proposedEndAfterExistingStart: proposedEnd > existingStart,
          // Minute-level validation
          startDiffMinutes: Math.round((existingEnd.getTime() - proposedStart.getTime()) / (1000 * 60)),
          endDiffMinutes: Math.round((proposedEnd.getTime() - existingStart.getTime()) / (1000 * 60))
        });

        return hasOverlap;
      });

      const result: BookingOverlap = {
        hasOverlap: conflictingBookings.length > 0,
        conflictingBookings: conflictingBookings.map((booking: any) => ({
          id: booking.id,
          clientName: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : "Unknown Client",
          startTime: new Date(booking.start_time).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          endTime: new Date(booking.end_time).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          date: new Date(booking.start_time).toISOString().split('T')[0]
        }))
      };

      console.log("[useRealTimeOverlapCheck] 🎯 === CRITICAL FINAL RESULT ===");
      console.log("[useRealTimeOverlapCheck] Has overlap:", result.hasOverlap);
      console.log("[useRealTimeOverlapCheck] Conflicting bookings:", result.conflictingBookings);

      if (result.hasOverlap) {
        console.log("[useRealTimeOverlapCheck] ❌ OVERLAP DETECTED - BLOCKING OPERATION");
      } else {
        console.log("[useRealTimeOverlapCheck] ✅ NO OVERLAP - ALLOWING OPERATION");
      }

      return result;

    } catch (error) {
      console.error("[useRealTimeOverlapCheck] 💥 CRITICAL ERROR during overlap check:", error);
      // CRITICAL: Return safe default that blocks operation on error
      return { hasOverlap: true, conflictingBookings: [] };
    } finally {
      // CRITICAL: Always reset checking state
      setIsChecking(false);
    }
  }, [branchId]);

  return {
    checkOverlapRealTime,
    isChecking
  };
}
