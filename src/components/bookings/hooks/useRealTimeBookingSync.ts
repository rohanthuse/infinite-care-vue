
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRealTimeBookingSync(branchId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!branchId) return;

    console.log("[useRealTimeBookingSync] Setting up real-time subscription for branch:", branchId);

    const channel = supabase
      .channel('booking-changes')
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
          
          // Invalidate and refetch booking data
          queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
          
          // Show appropriate notifications
          if (payload.eventType === 'INSERT') {
            toast.success("New booking created", {
              description: "Calendar updated automatically"
            });
          } else if (payload.eventType === 'UPDATE') {
            toast.info("Booking updated", {
              description: "Calendar refreshed"
            });
          } else if (payload.eventType === 'DELETE') {
            toast.info("Booking removed", {
              description: "Calendar updated"
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("[useRealTimeBookingSync] Subscription status:", status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          console.log("[useRealTimeBookingSync] ✅ Real-time booking sync connected");
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error("[useRealTimeBookingSync] ❌ Real-time connection failed:", status);
          toast.error("Real-time sync disconnected", {
            description: "Manual refresh may be needed"
          });
        }
      });

    return () => {
      console.log("[useRealTimeBookingSync] Cleaning up real-time subscription");
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [branchId, queryClient]);

  return { isConnected };
}
