
import { Client, Carer, Booking } from "../BookingTimeGrid";
import { getClientDisplayAddress } from "@/utils/addressUtils";

// Helper for consistent name and initials with fallback
export function safeName(first: any, last: any, fallback = "Unknown") {
  const name = [first ?? "", last ?? ""].filter(Boolean).join(" ").trim();
  return name || fallback;
}

export function safeInitials(first: any, last: any, fallback = "??") {
  const f = (first && first[0]) || "?";
  const l = (last && last[0]) || "?";
  return `${f}${l}`;
}

// Helper to extract just the postcode from structured addresses
function getClientPostcode(structuredAddresses: any[] | null): string {
  if (structuredAddresses && structuredAddresses.length > 0) {
    const defaultAddr = structuredAddresses.find((a: any) => a.is_default) || structuredAddresses[0];
    return defaultAddr?.postcode || '';
  }
  return '';
}

export function mapDBClientToClient(db: any): Client {
  console.log("[mapDBClientToClient] Mapping client:", db);
  
  const firstName = db.first_name ?? "";
  const lastName = db.last_name ?? "";
  
  // Use avatar_initials if available, otherwise generate from names
  const name = safeName(firstName, lastName);
  const initials = db.avatar_initials || safeInitials(firstName, lastName);
  
  // Get address using priority fallback: structured addresses > legacy address
  const address = getClientDisplayAddress(
    null, // No booking-specific location
    db.address, // Legacy address field
    db.client_addresses // Structured addresses from join
  );
  
  // Extract just the postcode for display
  const postcode = getClientPostcode(db.client_addresses);
  
  const mappedClient = {
    id: db.id,
    name,
    initials,
    bookings: [],
    bookingCount: 0,
    address: address || undefined,
    postcode: postcode || undefined,
    status: db.status,  // Preserve client status for UI indicators
    active_until: db.active_until || null,  // Include active_until for schedule filtering
  };
  
  console.log("[mapDBClientToClient] Mapped to:", mappedClient);
  
  return mappedClient;
}

export function mapDBCarerToCarer(db: any): Carer {
  console.log("[mapDBCarerToCarer] Mapping carer:", db);
  
  const firstName = db.first_name ?? "";
  const lastName = db.last_name ?? "";
  
  const mappedCarer = {
    id: db.id,
    name: safeName(firstName, lastName),
    initials: safeInitials(firstName, lastName),
    status: db.status,
    bookings: [],
    bookingCount: 0,
  };
  
  console.log("[mapDBCarerToCarer] Mapped to:", mappedCarer);
  
  return mappedCarer;
}

// Helper: placeholder client/carer for missing reference
export function getOrCreatePlaceholderClient(id: any): Client {
  return {
    id,
    name: "(Unknown Client)",
    initials: "??",
    bookingCount: 0,
    bookings: [],
  };
}

export function getOrCreatePlaceholderCarer(id: any): Carer {
  // If id is null/undefined, this is an intentionally unassigned booking
  if (!id) {
    return {
      id: null,
      name: "Not Assigned",
      initials: "—",
      bookingCount: 0,
      bookings: [],
    };
  }
  // If id exists but carer not found, it's a data issue
  return {
    id,
    name: "(Unknown Carer)",
    initials: "??",
    bookingCount: 0,
    bookings: [],
  };
}
