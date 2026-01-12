import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseISO, isValid } from 'date-fns';

/**
 * Hook to handle navigation to specific booking dates
 * Ensures proper URL parameter handling and date synchronization
 */
export function useBookingDateNavigation() {
  const [searchParams, setSearchParams] = useSearchParams();

  const navigateToBookingDate = (dateStr: string, bookingId?: string) => {
    console.log('[useBookingDateNavigation] Navigating to date:', dateStr, 'booking:', bookingId);
    
    const params = new URLSearchParams(searchParams);
    params.set('date', dateStr);
    
    if (bookingId) {
      params.set('focusBookingId', bookingId);
    }
    
    // Only use setSearchParams - no redundant history manipulation
    setSearchParams(params, { replace: true });
    
    return `${window.location.pathname}?${params.toString()}`;
  };

  const getCurrentDateFromUrl = () => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsedDate = parseISO(dateParam);
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    }
    return new Date();
  };

  const getFocusBookingId = () => {
    return searchParams.get('focusBookingId');
  };

  return {
    navigateToBookingDate,
    getCurrentDateFromUrl,
    getFocusBookingId
  };
}