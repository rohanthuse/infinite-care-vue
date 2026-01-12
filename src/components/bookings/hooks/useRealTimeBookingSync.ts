import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRealTimeBookingSync(branchId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!branchId) {
      console.log("[useRealTimeBookingSync] No branch ID provided");
      return;
    }

    // Check if user is authenticated before setting up real-time sync
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.log("[useRealTimeBookingSync] No authenticated user, skipping real-time setup");
          setIsConnected(false);
          return false;
        }
        return true;
      } catch (error) {
        console.error("[useRealTimeBookingSync] Auth check failed:", error);
        setIsConnected(false);
        return false;
      }
    };

    const setupRealTimeSync = async () => {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) return;

      console.log("[useRealTimeBookingSync] Setting up real-time subscription for branch:", branchId);

      // Clean up any existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create a unique channel name to avoid conflicts
      const channelName = `booking-changes-${branchId}-${Date.now()}`;

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `branch_id=eq.${branchId}`
          },
          (payload) => {
            console.log("[useRealTimeBookingSync] Real-time booking change detected:", payload);
            
            // Invalidate and refetch booking data - keeps calendar in sync
            queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
            
            // Also invalidate organization calendar for unified schedule view
            queryClient.invalidateQueries({ queryKey: ["organization-calendar"] });
            queryClient.invalidateQueries({ queryKey: ["organization-bookings"] });
            
            // Note: Toast notifications removed to prevent spam during bulk operations
            // The booking creation handlers already show appropriate success messages
          }
        )
        .subscribe((status, err) => {
          console.log("[useRealTimeBookingSync] Subscription status:", status, err);
          const wasConnected = isConnected;
          setIsConnected(status === 'SUBSCRIBED');
          
          if (status === 'SUBSCRIBED') {
            console.log("[useRealTimeBookingSync] ✅ Real-time booking sync connected");
            
            // If we're reconnecting after a disconnect, force a full refresh
            if (!wasConnected) {
              console.log("[useRealTimeBookingSync] 🔄 Reconnected - forcing full cache refresh");
              queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
              queryClient.invalidateQueries({ queryKey: ["organization-calendar"] });
              queryClient.invalidateQueries({ queryKey: ["organization-bookings"] });
              queryClient.refetchQueries({ queryKey: ["branch-bookings", branchId] });
              queryClient.refetchQueries({ queryKey: ["organization-calendar"], type: 'active' });
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error("[useRealTimeBookingSync] ❌ Real-time connection failed:", status);
            toast.error("Real-time sync disconnected", {
              description: "Manual refresh may be needed"
            });
          }
        });

      channelRef.current = channel;
    };

    // Setup sync
    setupRealTimeSync();

    return () => {
      console.log("[useRealTimeBookingSync] Cleaning up real-time subscription");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [branchId, queryClient]);

  return { isConnected };
}