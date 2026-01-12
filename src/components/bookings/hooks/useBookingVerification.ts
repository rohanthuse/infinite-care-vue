import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BookingVerificationProps {
  branchId?: string;
}

/**
 * Hook to verify that created bookings actually appear in the calendar
 * and provide recovery mechanisms if they don't
 */
export function useBookingVerification({ branchId }: BookingVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastCreatedBookings, setLastCreatedBookings] = useState<string[]>([]);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const queryClient = useQueryClient();

  const verifyBookingsAppear = async (expectedBookingIds: string[]) => {
    if (!branchId || expectedBookingIds.length === 0) return true;

    console.log('[useBookingVerification] Verifying bookings appear:', expectedBookingIds);
    setIsVerifying(true);
    setLastCreatedBookings(expectedBookingIds);
    setVerificationAttempts(0);

    // Wait a bit for cache to update
    await new Promise(resolve => setTimeout(resolve, 1000));

    return performVerification(expectedBookingIds);
  };

  const performVerification = async (expectedBookingIds: string[], attempt = 1): Promise<boolean> => {
    try {
      setVerificationAttempts(attempt);
      
      // Check if bookings appear in cached data
      const cachedData = queryClient.getQueryData(["branch-bookings", branchId]);
      console.log('[useBookingVerification] Cached branch bookings:', cachedData);
      
      const foundInCache = expectedBookingIds.filter(id => 
        Array.isArray(cachedData) && cachedData.some((b: any) => b.id === id)
      );
      
      console.log('[useBookingVerification] Found in cache:', foundInCache.length, '/', expectedBookingIds.length);
      
      if (foundInCache.length === expectedBookingIds.length) {
        console.log('[useBookingVerification] ✅ All bookings verified in cache');
        setIsVerifying(false);
        return true;
      }

      // If not all found in cache, query database directly
      console.log('[useBookingVerification] Querying database directly...');
      const { data: dbBookings, error } = await supabase
        .from('bookings')
        .select('id, client_id, staff_id, start_time, end_time, status')
        .eq('branch_id', branchId)
        .in('id', expectedBookingIds);

      if (error) {
        console.error('[useBookingVerification] Database verification failed:', error);
        throw error;
      }

      const foundInDb = dbBookings?.length || 0;
      console.log('[useBookingVerification] Found in database:', foundInDb, '/', expectedBookingIds.length);

      if (foundInDb === expectedBookingIds.length) {
        console.log('[useBookingVerification] ✅ All bookings exist in database');
        
        // If bookings exist in DB but not in cache, force cache refresh
        if (foundInCache.length < expectedBookingIds.length) {
          console.log('[useBookingVerification] 🔄 Bookings exist in DB but not in cache - forcing refresh');
          
          await queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
          await queryClient.refetchQueries({ queryKey: ["branch-bookings", branchId] });
          
          toast.success('Bookings created and visible!', {
            description: `${foundInDb} booking${foundInDb > 1 ? 's' : ''} successfully added to calendar`
          });
        }
        
        setIsVerifying(false);
        return true;
      }

      // If not all bookings found and we haven't tried too many times, retry
      if (attempt < 3) {
        console.log(`[useBookingVerification] Attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return performVerification(expectedBookingIds, attempt + 1);
      }

      // Final attempt failed
      console.error('[useBookingVerification] ❌ Verification failed after', attempt, 'attempts');
      setIsVerifying(false);
      
      toast.error('Booking Creation Issue Detected', {
        description: `${foundInDb}/${expectedBookingIds.length} bookings were created. Some may not be visible.`,
        duration: 8000,
        action: {
          label: 'Force Refresh',
          onClick: forceRefresh
        }
      });
      
      return false;

    } catch (error) {
      console.error('[useBookingVerification] Verification error:', error);
      setIsVerifying(false);
      
      toast.error('Unable to verify booking creation', {
        description: 'Please refresh the page to see your bookings',
        action: {
          label: 'Refresh Page',
          onClick: () => window.location.reload()
        }
      });
      
      return false;
    }
  };

  const forceRefresh = async () => {
    console.log('[useBookingVerification] 🔄 Force refresh requested');
    
    toast.info('Refreshing booking data...', { duration: 2000 });
    
    try {
      // Clear all booking-related cache aggressively
      await queryClient.invalidateQueries({ queryKey: ["branch-bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["client-bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["carer-bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["carer-appointments-full"] });
      
      // Remove all cached data entirely
      queryClient.removeQueries({ queryKey: ["branch-bookings"] });
      queryClient.removeQueries({ queryKey: ["client-bookings"] });
      queryClient.removeQueries({ queryKey: ["carer-bookings"] });
      
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ["branch-bookings", branchId] });
      
      toast.success('Calendar refreshed successfully!');
      
      // Additional safety: reload page after a short delay
      setTimeout(() => {
        console.log('[useBookingVerification] Performing safety page reload');
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('[useBookingVerification] Force refresh failed:', error);
      toast.error('Refresh failed - reloading page...', { duration: 1000 });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  // Add a function to verify database count matches cache count
  const verifyBookingCountIntegrity = async () => {
    if (!branchId) return true;
    
    try {
      console.log('[useBookingVerification] Verifying booking count integrity...');
      
      // Get database count
      const { count: dbCount, error } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId);
      
      if (error) {
        console.error('[useBookingVerification] Count query failed:', error);
        return true; // Don't block on error
      }
      
      // Get cache count
      const cachedData = queryClient.getQueryData<any>(["branch-bookings", branchId]);
      const cacheCount = cachedData?.bookings?.length || 0;
      
      console.log('[useBookingVerification] Count comparison - DB:', dbCount, 'Cache:', cacheCount);
      
      // If significant mismatch (more than 10% difference or more than 5 bookings difference)
      if (dbCount && Math.abs(dbCount - cacheCount) > Math.max(5, dbCount * 0.1)) {
        console.warn('[useBookingVerification] ⚠️ Significant count mismatch detected - forcing refresh');
        
        // Remove and refetch
        queryClient.removeQueries({ queryKey: ["branch-bookings", branchId] });
        await queryClient.refetchQueries({ queryKey: ["branch-bookings", branchId] });
        
        toast.info('Calendar data refreshed', {
          description: 'Booking display has been synchronized'
        });
        
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[useBookingVerification] Count verification error:', error);
      return true; // Don't block on error
    }
  };

  return {
    isVerifying,
    verificationAttempts,
    lastCreatedBookings,
    verifyBookingsAppear,
    forceRefresh,
    verifyBookingCountIntegrity
  };
}