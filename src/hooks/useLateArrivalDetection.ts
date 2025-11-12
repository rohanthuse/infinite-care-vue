import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LateArrivalCheck {
  isLate: boolean;
  minutesLate: number;
  scheduledTime: Date;
  staffName?: string;
}

export const useLateArrivalDetection = () => {
  const [showLateArrivalDialog, setShowLateArrivalDialog] = useState(false);
  const [lateArrivalInfo, setLateArrivalInfo] = useState<LateArrivalCheck | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

  const checkLateArrival = useCallback(async (bookingId: string): Promise<LateArrivalCheck> => {
    // Fetch booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        staff:staff_id (
          first_name,
          last_name
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      console.error('[useLateArrivalDetection] Error fetching booking:', error);
      return { isLate: false, minutesLate: 0, scheduledTime: new Date() };
    }

    const scheduledTime = new Date(booking.start_time);
    const currentTime = new Date();
    const diffMinutes = Math.floor((currentTime.getTime() - scheduledTime.getTime()) / (1000 * 60));

    const staffName = booking.staff 
      ? `${booking.staff.first_name} ${booking.staff.last_name}`
      : undefined;

    // Consider late if more than 15 minutes after scheduled time
    const isLate = diffMinutes > 15;

    return {
      isLate,
      minutesLate: Math.max(0, diffMinutes),
      scheduledTime,
      staffName,
    };
  }, []);

  const promptForLateArrivalReason = useCallback((bookingId: string, lateInfo: LateArrivalCheck) => {
    setPendingBookingId(bookingId);
    setLateArrivalInfo(lateInfo);
    setShowLateArrivalDialog(true);
  }, []);

  const clearLateArrivalDialog = useCallback(() => {
    setShowLateArrivalDialog(false);
    setLateArrivalInfo(null);
    setPendingBookingId(null);
  }, []);

  return {
    checkLateArrival,
    promptForLateArrivalReason,
    showLateArrivalDialog,
    lateArrivalInfo,
    pendingBookingId,
    clearLateArrivalDialog,
  };
};
