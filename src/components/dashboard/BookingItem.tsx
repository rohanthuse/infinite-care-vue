
import React from 'react';
import { Clock } from 'lucide-react';

export const BookingItem = ({
  number,
  staff,
  client,
  time,
  status,
  onClick,
}: {
  number: string;
  staff: string;
  client: string;
  time: string;
  status: string;
  onClick?: () => void;
}) => {
  let statusColor = 'bg-gray-100 text-gray-600';
  if (status === 'Done') statusColor = 'bg-green-100 text-green-700';
  else if (status === 'Booked') statusColor = 'bg-blue-100 text-blue-700';
  else if (status === 'Waiting') statusColor = 'bg-amber-100 text-amber-700';

  return (
    <div 
      className={`py-2 border-b last:border-0 flex items-center justify-between ${
        onClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="w-5 text-xs text-gray-500 mr-2">{number}.</div>
        <div>
          <div className="text-xs md:text-sm font-medium">{staff}</div>
          <div className="text-xs text-gray-500">{client}</div>
        </div>
      </div>
      <div className="flex items-center">
        <div className="flex items-center mr-3">
          <Clock className="h-3 w-3 text-gray-400 mr-1" />
          <span className="text-xs text-gray-600">{time}</span>
        </div>
        <div className={`${statusColor} rounded-full px-2 py-0.5 text-xs font-medium`}>
          {status}
        </div>
      </div>
    </div>
  );
};
