
import React from "react";
import { Booking } from "./BookingTimeGrid";
import { format, parseISO } from "date-fns";

interface BookingsListProps {
  bookings: Booking[];
  onBookingClick?: (booking: Booking) => void;
}

export const BookingsList: React.FC<BookingsListProps> = ({ 
  bookings,
  onBookingClick 
}) => {
  const formatDate = (date: string) => {
    try {
      return format(parseISO(date), 'MMM dd, yyyy');
    } catch (e) {
      return date;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-green-100 text-green-800';
      case 'unassigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'done':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'departed':
        return 'bg-teal-100 text-teal-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRowClick = (booking: Booking) => {
    if (onBookingClick) {
      onBookingClick(booking);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Date
            </th>
            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Time
            </th>
            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Client
            </th>
            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Carer
            </th>
            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Status
            </th>
            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {bookings.map((booking) => (
            <tr 
              key={booking.id} 
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleRowClick(booking)}
            >
              <td className="p-3 whitespace-nowrap text-sm text-gray-900">
                {formatDate(booking.date)}
              </td>
              <td className="p-3 whitespace-nowrap text-sm text-gray-900">
                {`${booking.startTime} - ${booking.endTime}`}
              </td>
              <td className="p-3 whitespace-nowrap text-sm">
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-2">
                    {booking.clientInitials}
                  </div>
                  <span>{booking.clientName}</span>
                </div>
              </td>
              <td className="p-3 whitespace-nowrap text-sm">
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium mr-2">
                    {booking.carerInitials}
                  </div>
                  <span>{booking.carerName}</span>
                </div>
              </td>
              <td className="p-3 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(booking.status)}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </td>
              <td className="p-3 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                {booking.notes || "—"}
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">
                No bookings found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
