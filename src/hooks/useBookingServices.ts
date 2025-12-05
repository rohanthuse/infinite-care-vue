import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BookingService {
  id: string;
  booking_id: string;
  service_id: string;
  created_at: string;
  service?: {
    id: string;
    title: string;
  };
}

// Fetch services for a single booking
export async function fetchBookingServices(bookingId: string): Promise<BookingService[]> {
  if (!bookingId) return [];

  const { data, error } = await supabase
    .from("booking_services")
    .select(`
      id,
      booking_id,
      service_id,
      created_at,
      services (
        id,
        title
      )
    `)
    .eq("booking_id", bookingId);

  if (error) {
    console.error("[fetchBookingServices] Error:", error);
    throw error;
  }

  return (data || []).map((item: any) => ({
    ...item,
    service: item.services,
  }));
}

// Fetch services for multiple bookings (batch)
export async function fetchBookingServicesBatch(bookingIds: string[]): Promise<Map<string, BookingService[]>> {
  if (!bookingIds.length) return new Map();

  const { data, error } = await supabase
    .from("booking_services")
    .select(`
      id,
      booking_id,
      service_id,
      created_at,
      services (
        id,
        title
      )
    `)
    .in("booking_id", bookingIds);

  if (error) {
    console.error("[fetchBookingServicesBatch] Error:", error);
    throw error;
  }

  // Group services by booking_id
  const serviceMap = new Map<string, BookingService[]>();
  (data || []).forEach((item: any) => {
    const service = {
      ...item,
      service: item.services,
    };
    const existing = serviceMap.get(item.booking_id) || [];
    existing.push(service);
    serviceMap.set(item.booking_id, existing);
  });

  return serviceMap;
}

// Hook to fetch services for a single booking
export function useBookingServices(bookingId: string) {
  return useQuery({
    queryKey: ["booking-services", bookingId],
    queryFn: () => fetchBookingServices(bookingId),
    enabled: !!bookingId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch services for multiple bookings
export function useBookingServicesBatch(bookingIds: string[]) {
  return useQuery({
    queryKey: ["booking-services-batch", bookingIds.sort().join(",")],
    queryFn: () => fetchBookingServicesBatch(bookingIds),
    enabled: bookingIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// Update services for a booking (replaces all existing services)
export async function updateBookingServices(
  bookingId: string,
  serviceIds: string[]
): Promise<void> {
  console.log("[updateBookingServices] Updating services for booking:", bookingId, serviceIds);

  // Delete existing services
  const { error: deleteError } = await supabase
    .from("booking_services")
    .delete()
    .eq("booking_id", bookingId);

  if (deleteError) {
    console.error("[updateBookingServices] Delete error:", deleteError);
    throw deleteError;
  }

  // Insert new services
  if (serviceIds.length > 0) {
    const { error: insertError } = await supabase
      .from("booking_services")
      .insert(
        serviceIds.map((serviceId) => ({
          booking_id: bookingId,
          service_id: serviceId,
        }))
      );

    if (insertError) {
      console.error("[updateBookingServices] Insert error:", insertError);
      throw insertError;
    }
  }

  console.log("[updateBookingServices] Successfully updated services");
}

// Hook to update booking services
export function useUpdateBookingServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, serviceIds }: { bookingId: string; serviceIds: string[] }) =>
      updateBookingServices(bookingId, serviceIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking-services", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking-services-batch"] });
      queryClient.invalidateQueries({ queryKey: ["branch-bookings"] });
    },
  });
}

// Create services for a new booking
export async function createBookingServices(
  bookingId: string,
  serviceIds: string[]
): Promise<void> {
  if (!serviceIds.length) return;

  console.log("[createBookingServices] Creating services for booking:", bookingId, serviceIds);

  const { error } = await supabase
    .from("booking_services")
    .insert(
      serviceIds.map((serviceId) => ({
        booking_id: bookingId,
        service_id: serviceId,
      }))
    );

  if (error) {
    console.error("[createBookingServices] Error:", error);
    throw error;
  }

  console.log("[createBookingServices] Successfully created services");
}
