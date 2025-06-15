
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
    <div className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className={`${priorityColor} rounded-full px-2 py-0.5 text-xs font-medium`}>
          {priority}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-600">{name}</div>
        <div className="flex items-center text-gray-500">
          <CalendarIcon className="h-3 w-3 mr-1" />
          {date}
        </div>
      </div>
    </div>
  );
};
