

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
  let statusColor = 'bg-muted text-muted-foreground';
  let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
  
  if (status === 'Done') {
    statusColor = 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
    badgeColor = 'bg-green-500 text-white border-green-600';
  } else if (status === 'Booked') {
    statusColor = 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700';
    badgeColor = 'bg-blue-500 text-white border-blue-600';
  } else if (status === 'Waiting') {
    statusColor = 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700';
    badgeColor = 'bg-amber-500 text-white border-amber-600';
  }

  return (
    <div 
      className={`py-3 px-2 border-b last:border-0 flex items-center justify-between rounded-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:bg-gradient-to-r hover:from-green-50/50 hover:to-transparent dark:hover:from-green-950/30 hover:shadow-sm' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-full ${badgeColor} flex items-center justify-center text-xs font-bold shadow-sm`}>
          {number}
        </div>
        <div>
          <div className="text-xs md:text-sm font-semibold text-foreground">{staff}</div>
          <div className="text-xs text-muted-foreground">{client}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-muted/50 rounded-full px-2 py-1">
          <Clock className="h-3 w-3 text-muted-foreground mr-1" />
          <span className="text-xs text-muted-foreground font-medium">{time}</span>
        </div>
        <div className={`${statusColor} rounded-full px-3 py-1 text-xs font-semibold shadow-sm`}>
          {status}
        </div>
      </div>
    </div>
  );
};
