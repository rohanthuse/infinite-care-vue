import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateBookingInput } from "./useCreateBooking";
import { useGenerateBookingInvoice } from "@/hooks/useGenerateBookingInvoice";
import { createBookingServices } from "@/hooks/useBookingServices";
import { toast } from "sonner";

async function createMultipleBookings(inputs: CreateBookingInput[]) {
  console.log("[createMultipleBookings] Creating bookings:", inputs.length, "bookings");
  console.log("[createMultipleBookings] Branch ID from first booking:", inputs[0]?.branch_id);
  
  // Insert all bookings in one API call (if possible), else fallback to multiple
  if (!Array.isArray(inputs) || inputs.length === 0) {
    console.log("[createMultipleBookings] No bookings to create");
    return { bookings: [], serviceInputs: [] };
  }

  // Store service_ids for each booking before inserting (since service_ids is not in DB schema)
  const serviceInputs = inputs.map(input => ({
    service_ids: input.service_ids || (input.service_id ? [input.service_id] : [])
  }));

  // Remove service_ids from inputs since it's not in the bookings table schema
  const dbInputs = inputs.map(({ service_ids, ...rest }) => rest);

  const { data, error } = await supabase
    .from("bookings")
    .insert(dbInputs)
    .select();

  if (error) {
    console.error("[createMultipleBookings] Database error:", error);
    throw error;
  }
  
  console.log("[createMultipleBookings] Successfully created bookings:", data?.length || 0);
  
  // Return both bookings and service inputs for junction table population
  return { bookings: data || [], serviceInputs };
}

export function useCreateMultipleBookings(branchId?: string) {
  const queryClient = useQueryClient();
  const { generateInvoiceForBooking } = useGenerateBookingInvoice();
  
  return useMutation({
    mutationFn: createMultipleBookings,
    onSuccess: async (result) => {
      const { bookings: data, serviceInputs } = result;
      console.log('[useCreateMultipleBookings] ===== BOOKING CREATION SUCCESS =====');
      console.log('Successfully created bookings:', data?.length || 0);
      
      if (data && Array.isArray(data)) {
        console.log('Sample created booking:', data[0]);
        
        // Save services to junction table for each booking
        console.log('[useCreateMultipleBookings] Saving services to junction table...');
        for (let i = 0; i < data.length; i++) {
          const booking = data[i];
          const serviceIds = serviceInputs[i]?.service_ids || [];
          if (serviceIds.length > 0) {
            try {
              await createBookingServices(booking.id, serviceIds);
              console.log(`[useCreateMultipleBookings] Saved ${serviceIds.length} services for booking ${booking.id}`);
            } catch (err) {
              console.error(`[useCreateMultipleBookings] Failed to save services for booking ${booking.id}:`, err);
            }
          }
        }
      }
      
      // Invalidate and refetch all relevant queries with enhanced verification
      console.log('[useCreateMultipleBookings] Invalidating cache for branch:', branchId);
      
      try {
        // Primary cache invalidation
        await queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
        console.log('[useCreateMultipleBookings] ✅ Branch bookings cache invalidated');
        
        // Secondary cache invalidations
        if (data && Array.isArray(data)) {
          const uniqueClientIds = [...new Set(data.map((b: any) => b.client_id).filter(Boolean))];
          const uniqueStaffIds = [...new Set(data.map((b: any) => b.staff_id).filter(Boolean))];
          
          console.log('[useCreateMultipleBookings] Invalidating for clients:', uniqueClientIds.length);
          console.log('[useCreateMultipleBookings] Invalidating for staff:', uniqueStaffIds.length);
          
          await Promise.all([
            ...uniqueClientIds.map(clientId => 
              queryClient.invalidateQueries({ queryKey: ["client-bookings", clientId] })
            ),
            ...uniqueStaffIds.map(staffId => [
              queryClient.invalidateQueries({ queryKey: ["carer-bookings", staffId] }),
              queryClient.invalidateQueries({ queryKey: ["carer-appointments-full", staffId] })
            ]).flat()
          ]);
        }
        
        console.log('[useCreateMultipleBookings] ✅ All cache invalidations complete');
        
        // Auto-generate invoices for all created bookings
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('[useCreateMultipleBookings] Auto-generating invoices for', data.length, 'bookings');
          
          try {
            const firstBookingBranchId = data[0]?.branch_id;
            
            if (firstBookingBranchId) {
              const { data: branch } = await supabase
                .from('branches')
                .select('organization_id')
                .eq('id', firstBookingBranchId)
                .single();
              
              if (branch?.organization_id) {
                const invoiceResults = await Promise.allSettled(
                  data.map(booking => 
                    generateInvoiceForBooking({
                      bookingId: booking.id,
                      branchId: booking.branch_id,
                      organizationId: branch.organization_id
                    })
                  )
                );
                
                const successful = invoiceResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
                const failed = invoiceResults.length - successful;
                
                // Log invoice generation results (toast handled by useBookingHandlers for consolidated message)
                console.log(`[useCreateMultipleBookings] Generated ${successful} invoices, ${failed} failed/skipped`);
                
                // Invalidate invoice queries
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ['branch-invoices', firstBookingBranchId] }),
                  
                  ...data.map(b => queryClient.invalidateQueries({ queryKey: ['client-billing', b.client_id] }))
                ]);
              }
            }
          } catch (invoiceError: any) {
            console.error('[useCreateMultipleBookings] Invoice generation error:', {
              message: invoiceError.message,
              code: invoiceError.code,
              details: invoiceError.details
            });
            toast.error('Some invoices could not be generated', {
              description: invoiceError.message || 'Please check booking details'
            });
          }
        }
        
        // Force immediate refetch of branch bookings
        setTimeout(() => {
          console.log('[useCreateMultipleBookings] Forcing immediate refetch...');
          queryClient.refetchQueries({ queryKey: ["branch-bookings", branchId] });
        }, 100);
        
      } catch (error) {
        console.error('[useCreateMultipleBookings] ❌ Cache invalidation failed:', error);
        // Fallback: force reload of the page as last resort
        setTimeout(() => {
          console.warn('[useCreateMultipleBookings] Forcing page refresh due to cache issues');
          window.location.reload();
        }, 2000);
      }
    },
    onError: (error) => {
      console.error("[useCreateMultipleBookings] onError:", error);
    }
  });
}
