

import React from 'react';
import { CalendarIcon, AlertCircle } from 'lucide-react';

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
  let priorityColor = 'bg-muted text-muted-foreground';
  let borderColor = 'border-t-slate-300';
  let gradientBg = 'bg-card';
  let iconColor = 'text-muted-foreground';
  
  if (priority === 'High') {
    priorityColor = 'bg-red-100 text-red-700 border border-red-200';
    borderColor = 'border-t-red-500';
    gradientBg = 'bg-gradient-to-br from-red-50/60 to-card';
    iconColor = 'text-red-500';
  } else if (priority === 'Medium') {
    priorityColor = 'bg-amber-100 text-amber-700 border border-amber-200';
    borderColor = 'border-t-amber-500';
    gradientBg = 'bg-gradient-to-br from-amber-50/60 to-card';
    iconColor = 'text-amber-500';
  } else if (priority === 'Low') {
    priorityColor = 'bg-green-100 text-green-700 border border-green-200';
    borderColor = 'border-t-green-500';
    gradientBg = 'bg-gradient-to-br from-green-50/60 to-card';
    iconColor = 'text-green-500';
  }

  return (
    <div className={`p-4 rounded-lg border border-border ${gradientBg} shadow-sm hover:shadow-lg transition-all duration-300 min-w-0 border-t-4 ${borderColor} group`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <AlertCircle className={`h-4 w-4 ${iconColor} shrink-0 mt-0.5 group-hover:scale-110 transition-transform`} />
          <h4 
            className="font-semibold text-sm leading-5 text-card-foreground min-w-0 flex-1 line-clamp-2" 
            title={title}
          >
            {title}
          </h4>
        </div>
        <div className={`${priorityColor} rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 shadow-sm`}>
          {priority}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs gap-2">
        <div 
          className="text-muted-foreground truncate min-w-0 flex-1 font-medium" 
          title={name}
        >
          {name}
        </div>
        <div className="flex items-center text-muted-foreground shrink-0 bg-muted/50 rounded-full px-2 py-0.5">
          <CalendarIcon className="h-3 w-3 mr-1" />
          <span className="whitespace-nowrap font-medium">{date}</span>
        </div>
      </div>
    </div>
  );
};
