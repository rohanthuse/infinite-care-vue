
import React from 'react';
import { Clock } from 'lucide-react';

interface BookingItemProps {
  number: string;
  staff: string;
  client: string;
  time: string;
  status: 'Done' | 'Booked' | 'Waiting' | 'Cancelled';
}

export const BookingItem = ({ number, staff, client, time, status }: BookingItemProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800';
      case 'Booked':
        return 'bg-blue-100 text-blue-800';
      case 'Waiting':
        return 'bg-amber-100 text-amber-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center p-2.5 border-b border-gray-100 last:border-0">
      <div className="mr-2 h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-700">
        {number}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{staff}</div>
        <div className="text-xs text-gray-500">{client}</div>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 mr-2">
        <Clock className="h-3 w-3" />
        <span>{time}</span>
      </div>
      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {status}
      </div>
    </div>
  );
};

export default BookingItem;
