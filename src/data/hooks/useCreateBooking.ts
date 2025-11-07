import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkClientSuspensionForBilling } from "@/services/SuspensionAwareInvoiceService";
import { useGenerateBookingInvoice } from "@/hooks/useGenerateBookingInvoice";
import { toast } from "@/hooks/use-toast";

export interface CreateBookingInput {
  branch_id: string;
  client_id: string;
  staff_id?: string; // Made optional to support unassigned bookings
  start_time: string; // ISO string
  end_time: string;   // ISO string
  service_id: string | null; // Optional service ID for unassigned bookings
  revenue?: number;
  status?: string; // <-- ADDED
  notes?: string;
}

export async function createBooking(input: CreateBookingInput) {
  console.log('[createBooking] ========== BOOKING CREATION START ==========');
  console.log('[createBooking] Input data:', JSON.stringify(input, null, 2));
  
  // CRITICAL: Check if client is suspended before creating booking
  console.log('[createBooking] Checking client suspension status...');
  const suspensionStatus = await checkClientSuspensionForBilling(input.client_id);
  
  if (suspensionStatus.isSuspended && suspensionStatus.visitsSuspended) {
    const message = `Cannot create booking: Client is suspended until ${
      suspensionStatus.effectiveUntil || 'indefinitely'
    }. Reason: ${suspensionStatus.reason || 'Not specified'}`;
    
    console.error('[createBooking] Blocked by suspension:', message);
    throw new Error(message);
  }
  
  const { data, error } = await supabase
    .from("bookings")
    .insert([
      {
        branch_id: input.branch_id,
        client_id: input.client_id,
        staff_id: input.staff_id || null, // Handle null staff_id for unassigned bookings
        start_time: input.start_time,
        end_time: input.end_time,
        service_id: input.service_id,
        revenue: input.revenue || null,
        status: input.status || (input.staff_id ? "assigned" : "unassigned"), // Auto-set status based on staff assignment
        notes: input.notes || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('[createBooking] ❌ DATABASE ERROR:', error);
    console.error('[createBooking] ❌ Error message:', error.message);
    console.error('[createBooking] ❌ Error details:', error.details);
    throw error;
  }
  
  console.log('[createBooking] ✅ SUCCESS - Booking saved to database:', data);
  console.log('[createBooking] ✅ New booking ID:', data?.id);
  console.log('[createBooking] ========== BOOKING CREATION END ==========');
  return data;
}

export function useCreateBooking(branchId?: string) {
  const queryClient = useQueryClient();
  const { generateInvoiceForBooking } = useGenerateBookingInvoice();
  
  return useMutation({
    mutationFn: createBooking,
    onSuccess: async (data) => {
      try {
        // Always invalidate queries using the created booking's branch_id
        const bookingBranchId = data.branch_id;
        
        console.log('[useCreateBooking] Invalidating queries for successful booking creation:', {
          bookingId: data.id,
          branchId: bookingBranchId,
          clientId: data.client_id,
          staffId: data.staff_id
        });

        // Comprehensive cache invalidation with retry logic
        const invalidateWithRetry = async (queryKey: (string | undefined)[]) => {
          try {
            await queryClient.invalidateQueries({ queryKey });
            console.log('[useCreateBooking] Successfully invalidated:', queryKey);
          } catch (error) {
            console.warn('[useCreateBooking] Failed to invalidate, retrying:', queryKey, error);
            // Retry once after a short delay
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey }).catch(console.error);
            }, 1000);
          }
        };

        // Invalidate all relevant queries - CRITICAL: Include organization calendar
        const invalidationPromises = [
          invalidateWithRetry(["branch-bookings", bookingBranchId]),
          invalidateWithRetry(["client-bookings", data.client_id]),
          invalidateWithRetry(["organization-calendar"]), // FIX: Add organization calendar invalidation
          invalidateWithRetry(["organization-bookings"]) // FIX: Add organization bookings invalidation
        ];
        
        // CRITICAL: Force immediate refetch to ensure calendar updates
        await queryClient.refetchQueries({ 
          queryKey: ['organization-calendar'],
          type: 'active'
        });

        // Only invalidate carer-related queries if staff_id exists (not unassigned booking)
        if (data.staff_id) {
          invalidationPromises.push(
            invalidateWithRetry(["carer-bookings", data.staff_id]),
            invalidateWithRetry(["carer-appointments-full", data.staff_id])
          );
        }

        await Promise.all(invalidationPromises);
        
        // Also invalidate with the provided branchId for backwards compatibility
        if (branchId && branchId !== bookingBranchId) {
          await invalidateWithRetry(["branch-bookings", branchId]);
        }

        console.log('[useCreateBooking] All query invalidations completed');

        // NEW: Auto-generate invoice for the booking
        console.log('[useCreateBooking] Auto-generating invoice for booking:', data.id);
        
        try {
          // Get organization_id from branch
          const { data: branch } = await supabase
            .from('branches')
            .select('organization_id')
            .eq('id', bookingBranchId)
            .single();

          if (branch?.organization_id) {
            const result = await generateInvoiceForBooking({
              bookingId: data.id,
              branchId: bookingBranchId,
              organizationId: branch.organization_id
            });
            
            if (result.success) {
              console.log('[useCreateBooking] ✅ Invoice auto-generated successfully');
              
              toast({
                title: 'Booking Created',
                description: `Invoice ${result.invoiceNumber} generated successfully`,
              });
              
              // Invalidate invoice queries
              await Promise.all([
                invalidateWithRetry(['branch-invoices', bookingBranchId]),
                invalidateWithRetry(['branch-booking-invoices', bookingBranchId]),
                invalidateWithRetry(['client-billing', data.client_id])
              ]);
            } else {
              console.warn('[useCreateBooking] ⚠️ Invoice generation skipped:', result.message);
            }
          } else {
            console.warn('[useCreateBooking] ⚠️ Could not get organization_id for invoice generation');
          }
        } catch (invoiceError: any) {
          console.error('[useCreateBooking] ❌ Failed to auto-generate invoice:', invoiceError);
          
          toast({
            title: 'Invoice Generation Failed',
            description: invoiceError.message || 'Failed to generate invoice. You can create it manually later.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('[useCreateBooking] Error during query invalidation:', error);
        // Force a hard refetch as fallback
        queryClient.refetchQueries({ queryKey: ["branch-bookings"] });
      }
    },
  });
}
