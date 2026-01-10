import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateBookingInput } from "./useCreateBooking";
import { createBookingServices } from "@/hooks/useBookingServices";

const BATCH_SIZE = 25; // Safe batch size to avoid statement timeouts with trigger overhead

interface BatchProgress {
  currentBatch: number;
  totalBatches: number;
  processedCount: number;
  totalCount: number;
}

interface CreateMultipleBookingsResult {
  bookings: any[];
  serviceInputs: { service_ids: string[] }[];
  batchProgress?: BatchProgress;
}

async function createMultipleBookings(
  inputs: CreateBookingInput[],
  onProgress?: (progress: BatchProgress) => void
): Promise<CreateMultipleBookingsResult> {
  console.log("[createMultipleBookings] Creating bookings:", inputs.length, "bookings");
  console.log("[createMultipleBookings] Branch ID from first booking:", inputs[0]?.branch_id);
  
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

  // For small batches, insert all at once (faster)
  if (dbInputs.length <= BATCH_SIZE) {
    console.log("[createMultipleBookings] Small batch - inserting all at once");
    const { data, error } = await supabase
      .from("bookings")
      .insert(dbInputs)
      .select();

    if (error) {
      console.error("[createMultipleBookings] Database error:", error);
      throw error;
    }
    
    console.log("[createMultipleBookings] Successfully created bookings:", data?.length || 0);
    return { bookings: data || [], serviceInputs };
  }

  // For large batches, process in chunks to avoid statement timeouts
  console.log(`[createMultipleBookings] Large batch (${dbInputs.length}) - processing in chunks of ${BATCH_SIZE}`);
  
  const totalBatches = Math.ceil(dbInputs.length / BATCH_SIZE);
  const allCreatedBookings: any[] = [];
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIdx = batchIndex * BATCH_SIZE;
    const endIdx = Math.min(startIdx + BATCH_SIZE, dbInputs.length);
    const batch = dbInputs.slice(startIdx, endIdx);
    
    console.log(`[createMultipleBookings] Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} bookings)`);
    
    // Report progress
    if (onProgress) {
      onProgress({
        currentBatch: batchIndex + 1,
        totalBatches,
        processedCount: allCreatedBookings.length,
        totalCount: dbInputs.length
      });
    }
    
    const { data, error } = await supabase
      .from("bookings")
      .insert(batch)
      .select();

    if (error) {
      console.error(`[createMultipleBookings] Batch ${batchIndex + 1} failed:`, error);
      
      // If we already created some bookings, return partial success info in error
      if (allCreatedBookings.length > 0) {
        const partialError = new Error(
          `Partial success: Created ${allCreatedBookings.length}/${dbInputs.length} bookings. ` +
          `Batch ${batchIndex + 1} failed: ${error.message}`
        );
        (partialError as any).partialData = allCreatedBookings;
        (partialError as any).code = 'PARTIAL_SUCCESS';
        throw partialError;
      }
      
      throw error;
    }
    
    if (data) {
      allCreatedBookings.push(...data);
    }
    
    console.log(`[createMultipleBookings] Batch ${batchIndex + 1} complete - ${allCreatedBookings.length}/${dbInputs.length} total`);
    
    // Small delay between batches to avoid overwhelming the database
    if (batchIndex < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log("[createMultipleBookings] All batches complete. Total created:", allCreatedBookings.length);
  
  return { 
    bookings: allCreatedBookings, 
    serviceInputs,
    batchProgress: {
      currentBatch: totalBatches,
      totalBatches,
      processedCount: allCreatedBookings.length,
      totalCount: dbInputs.length
    }
  };
}

export function useCreateMultipleBookings(branchId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (inputs: CreateBookingInput[]) => createMultipleBookings(inputs),
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
        
        // Note: Invoice generation is handled automatically by the database trigger 'auto_create_invoice_for_booking'
        // We just need to invalidate the invoice caches after a short delay to pick up the trigger-generated invoices
        if (data && Array.isArray(data) && data.length > 0) {
          const firstBookingBranchId = data[0]?.branch_id;
          if (firstBookingBranchId) {
            // Small delay to allow DB trigger to complete invoice creation
            setTimeout(async () => {
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['branch-invoices', firstBookingBranchId] }),
                ...data.map(b => queryClient.invalidateQueries({ queryKey: ['client-billing', b.client_id] }))
              ]);
              console.log('[useCreateMultipleBookings] Invoice caches invalidated (DB trigger handles generation)');
            }, 500);
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
    onError: (error: any) => {
      console.error("[useCreateMultipleBookings] onError:", error);
      
      // Handle partial success scenario
      if (error.code === 'PARTIAL_SUCCESS' && error.partialData) {
        console.warn("[useCreateMultipleBookings] Partial success - some bookings were created:", error.partialData.length);
      }
    }
  });
}
