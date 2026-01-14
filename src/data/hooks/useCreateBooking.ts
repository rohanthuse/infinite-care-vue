import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkClientSuspensionForBilling } from "@/services/SuspensionAwareInvoiceService";
import { useGenerateBookingInvoice } from "@/hooks/useGenerateBookingInvoice";
import { toast } from "@/hooks/use-toast";
import { createBookingServices } from "@/hooks/useBookingServices";
import { notifyBookingCreated } from "@/utils/bookingNotifications";
import { ensureValidBookingTimes } from "@/utils/bookingTimeValidation";

export interface CreateBookingInput {
  branch_id: string;
  client_id: string;
  staff_id?: string; // Made optional to support unassigned bookings
  start_time: string; // ISO string
  end_time: string;   // ISO string
  service_id?: string | null; // Deprecated - kept for backwards compatibility
  service_ids?: string[]; // New: array of service IDs
  revenue?: number;
  status?: string; // <-- ADDED
  notes?: string;
  location_address?: string; // Address where the booking takes place (snapshot)
}

export async function createBooking(input: CreateBookingInput) {
  console.log('[createBooking] ========== BOOKING CREATION START ==========');
  console.log('[createBooking] Input data:', JSON.stringify(input, null, 2));
  
  // CRITICAL: Ensure branch_id is set - fallback to client's branch_id if missing
  let bookingBranchId = input.branch_id;
  if (!bookingBranchId && input.client_id) {
    console.log('[createBooking] branch_id missing, fetching from client...');
    const { data: client } = await supabase
      .from('clients')
      .select('branch_id')
      .eq('id', input.client_id)
      .single();
    
    bookingBranchId = client?.branch_id || null;
    console.log('[createBooking] Got branch_id from client:', bookingBranchId);
  }
  
  if (!bookingBranchId) {
    throw new Error('branch_id is required for booking creation. Could not determine from client.');
  }
  
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
  
  // CRITICAL: Validate and auto-correct booking times to prevent date mismatches
  const validatedTimes = ensureValidBookingTimes(input.start_time, input.end_time);
  console.log('[createBooking] Validated booking times:', validatedTimes);
  
  // Get primary service_id for backwards compatibility
  const serviceIds = input.service_ids || (input.service_id ? [input.service_id] : []);
  const primaryServiceId = serviceIds[0] || null;
  
  const { data, error } = await supabase
    .from("bookings")
    .insert([
      {
        branch_id: bookingBranchId, // Use resolved branch_id (fallback applied if needed)
        client_id: input.client_id,
        staff_id: input.staff_id || null, // Handle null staff_id for unassigned bookings
        start_time: validatedTimes.startTime,
        end_time: validatedTimes.endTime,
        service_id: primaryServiceId, // Keep for backwards compatibility
        revenue: input.revenue || null,
        status: input.status || (input.staff_id ? "assigned" : "unassigned"), // Auto-set status based on staff assignment
        notes: input.notes || null,
        location_address: input.location_address || null, // Store booking location as snapshot
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
  
  // Create entries in booking_services junction table for all services
  if (serviceIds.length > 0 && data?.id) {
    try {
      await createBookingServices(data.id, serviceIds);
      console.log('[createBooking] ✅ Services saved to junction table:', serviceIds);
    } catch (serviceError) {
      console.error('[createBooking] ⚠️ Error saving to booking_services:', serviceError);
      // Don't fail the booking creation, just log the error
    }
  }
  
  console.log('[createBooking] ✅ SUCCESS - Booking saved to database:', data);
  console.log('[createBooking] ✅ New booking ID:', data?.id);
  
  // Get client name for notifications
  let clientName: string | undefined;
  if (input.client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('first_name, last_name')
      .eq('id', input.client_id)
      .single();
    if (client) {
      clientName = `${client.first_name} ${client.last_name}`;
    }
  }

  // Get organization_id from branch for notifications
  let organizationId: string | undefined;
  if (bookingBranchId) {
    const { data: branch } = await supabase
      .from('branches')
      .select('organization_id')
      .eq('id', bookingBranchId)
      .single();
    organizationId = branch?.organization_id || undefined;
  }

  // Send notifications for booking creation
  await notifyBookingCreated({
    bookingId: data.id,
    branchId: bookingBranchId,
    organizationId,
    clientId: input.client_id,
    staffId: input.staff_id,
    clientName,
    startTime: input.start_time,
    notificationType: 'booking_created',
  });
  
  console.log('[createBooking] ========== BOOKING CREATION END ==========');
  return { ...data, service_ids: serviceIds };
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

        // CRITICAL: Use predicate-based invalidation for branch-bookings and branch-bookings-range
        // This ensures the Unified Schedule (which uses useBranchBookingsInRange) updates immediately
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0];
            return key === "branch-bookings" || key === "branch-bookings-range";
          }
        });

        // Invalidate all relevant queries - CRITICAL: Include organization calendar
        const invalidationPromises = [
          invalidateWithRetry(["client-bookings", data.client_id]),
          invalidateWithRetry(["organization-calendar"]),
          invalidateWithRetry(["organization-bookings"])
        ];
        
        // CRITICAL: Force immediate refetch of active range-based queries
        await queryClient.refetchQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0];
            return key === "branch-bookings" || key === "branch-bookings-range" || key === "organization-calendar";
          },
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

        console.log('[useCreateBooking] All query invalidations completed including branch-bookings-range');

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
                
                invalidateWithRetry(['client-billing', data.client_id])
              ]);
            } else if ((result as any).skipped) {
              // No rate schedule - just show booking success, no error
              console.log('[useCreateBooking] Invoice skipped - no rate schedule:', result.message);
              toast({
                title: 'Booking Created',
                description: 'Booking saved successfully.',
              });
            } else {
              // Other non-success cases (e.g., invoice already exists)
              console.log('[useCreateBooking] Invoice generation skipped:', result.message);
              toast({
                title: 'Booking Created',
                description: 'Booking saved successfully.',
              });
            }
          } else {
            console.warn('[useCreateBooking] Could not get organization_id for invoice generation');
            toast({
              title: 'Booking Created',
              description: 'Booking saved successfully.',
            });
          }
        } catch (invoiceError: any) {
          // Only log the error, don't show destructive toast for invoice issues
          console.error('[useCreateBooking] Invoice generation error:', invoiceError);
          // Still show booking success since booking was created
          toast({
            title: 'Booking Created',
            description: 'Booking saved. Invoice can be created later.',
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
