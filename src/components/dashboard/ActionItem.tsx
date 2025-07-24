
import React from 'react';
import { CalendarIcon } from 'lucide-react';

export const ActionItem = ({
  title,
  name,
  date,
  priority,
}: {
  title: string;
  name: string;
  date: string;
  priority: string;
}) => {
  let priorityColor = 'bg-gray-100 text-gray-600';
  if (priority === 'High') priorityColor = 'bg-red-100 text-red-700';
  else if (priority === 'Medium') priorityColor = 'bg-amber-100 text-amber-700';
  else if (priority === 'Low') priorityColor = 'bg-green-100 text-green-700';

  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow min-w-0">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 
          className="font-medium text-sm leading-5 text-gray-900 min-w-0 flex-1 line-clamp-2" 
          title={title}
        >
          {title}
        </h4>
        <div className={`${priorityColor} rounded-full px-2 py-0.5 text-xs font-medium shrink-0`}>
          {priority}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs gap-2">
        <div 
          className="text-gray-600 truncate min-w-0 flex-1" 
          title={name}
        >
          {name}
        </div>
        <div className="flex items-center text-gray-500 shrink-0">
          <CalendarIcon className="h-3 w-3 mr-1" />
          <span className="whitespace-nowrap">{date}</span>
        </div>
      </div>
    </div>
  );
};
