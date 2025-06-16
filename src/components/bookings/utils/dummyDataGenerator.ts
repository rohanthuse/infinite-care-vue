
import { Client, Carer, Booking } from "../BookingTimeGrid";

// Dummy booking generator
export function makeDummyBookings(
  clients: Client[],
  carers: Carer[]
): Booking[] {
  const statuses = [
    "assigned",
    "in-progress",
    "done",
    "departed",
    "cancelled",
    "unassigned",
    "suspended"
  ] as const;

  const now = new Date();

  return Array.from({ length: 10 }).map((_, i) => {
    const client = clients[i % clients.length];
    const carer = carers[i % carers.length];
    const startHour = 8 + (i % 4) * 2;
    const endHour = startHour + 1;
    const date = new Date(now);
    date.setDate(now.getDate() + (i % 5));
    return {
      id: `dummy-bk-${i + 1}`,
      clientId: client.id,
      clientName: client.name,
      clientInitials: client.initials,
      carerId: carer.id,
      carerName: carer.name,
      carerInitials: carer.initials,
      startTime: `${String(startHour).padStart(2, "0")}:00`,
      endTime: `${String(endHour).padStart(2, "0")}:00`,
      date: date.toISOString().slice(0, 10),
      status: statuses[i % statuses.length],
      notes: "",
    };
  });
}

export const dummyClients: Client[] = [
  { id: 'c1', name: 'Alice Lowe', initials: 'AL', bookingCount: 0, bookings: [] },
  { id: 'c2', name: 'Sam James', initials: 'SJ', bookingCount: 0, bookings: [] },
  { id: 'c3', name: 'George Pan', initials: 'GP', bookingCount: 0, bookings: [] },
  { id: 'c4', name: 'Helen Ford', initials: 'HF', bookingCount: 0, bookings: [] },
  { id: 'c5', name: 'Maria Lee', initials: 'ML', bookingCount: 0, bookings: [] },
];

export const dummyCarers: Carer[] = [
  { id: 'x1', name: 'John Smith', initials: 'JS', bookingCount: 0, bookings: [] },
  { id: 'x2', name: 'Kay Lum', initials: 'KL', bookingCount: 0, bookings: [] },
  { id: 'x3', name: 'Priya Patel', initials: 'PP', bookingCount: 0, bookings: [] },
  { id: 'x4', name: 'Mohamed Shaheen', initials: 'MS', bookingCount: 0, bookings: [] },
];
