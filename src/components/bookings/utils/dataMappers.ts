
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

// Helper to extract postcode from address string using common patterns
function extractPostcodeFromAddress(address: string | undefined): string {
  if (!address) return '';
  
  // UK postcode pattern (SW1A 1AA, M1 1AE, AL10 9HX, WD17 2AX)
  const ukPostcodeRegex = /\b([A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2})\b/i;
  const ukMatch = address.match(ukPostcodeRegex);
  if (ukMatch) return ukMatch[1].toUpperCase();
  
  // Indian PIN code (6 digits)
  const indianPinRegex = /\b(\d{6})\b/;
  const indianMatch = address.match(indianPinRegex);
  if (indianMatch) return indianMatch[1];
  
  // 5-digit codes (US ZIP)
  const fiveDigitRegex = /\b(\d{5})\b/;
  const fiveDigitMatch = address.match(fiveDigitRegex);
  if (fiveDigitMatch) return fiveDigitMatch[1];
  
  return '';
}

// Helper to get client postcode with priority fallback:
// 1) Structured addresses, 2) pin_code field, 3) Extract from legacy address
function getClientPostcodeWithFallback(
  structuredAddresses: any[] | null,
  pinCode: string | null,
  address: string | null
): string {
  // Priority 1: Structured addresses
  if (structuredAddresses && structuredAddresses.length > 0) {
    const defaultAddr = structuredAddresses.find((a: any) => a.is_default) || structuredAddresses[0];
    if (defaultAddr?.postcode) return defaultAddr.postcode;
  }
  
  // Priority 2: Direct pin_code field from clients table
  if (pinCode) return pinCode;
  
  // Priority 3: Extract from legacy address using regex
  if (address) {
    return extractPostcodeFromAddress(address);
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
  
  // Extract postcode with priority fallback: structured addresses → pin_code → address extraction
  const postcode = getClientPostcodeWithFallback(
    db.client_addresses,
    db.pin_code,
    db.address
  );
  
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
    email: db.email || undefined,  // Include email for communication features
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
