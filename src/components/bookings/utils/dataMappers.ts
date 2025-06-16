
import { Client, Carer, Booking } from "../BookingTimeGrid";

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

export function mapDBClientToClient(db: any): Client {
  const firstName = db.first_name ?? "";
  const lastName = db.last_name ?? "";
  const name = db.avatar_initials
    ? db.first_name + " " + db.last_name
    : safeName(firstName, lastName);
  const initials =
    db.avatar_initials ||
    safeInitials(firstName, lastName);
  return {
    id: db.id,
    name,
    initials,
    bookings: [],
    bookingCount: 0,
  };
}

export function mapDBCarerToCarer(db: any): Carer {
  const firstName = db.first_name ?? "";
  const lastName = db.last_name ?? "";
  return {
    id: db.id,
    name: safeName(firstName, lastName),
    initials: safeInitials(firstName, lastName),
    bookings: [],
    bookingCount: 0,
  };
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
  return {
    id,
    name: "(Unknown Carer)",
    initials: "??",
    bookingCount: 0,
    bookings: [],
  };
}
