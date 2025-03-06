
import React from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ActionItemProps {
  title: string;
  name: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
}

export const ActionItem = ({ title, name, date, priority }: ActionItemProps) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-amber-100 text-amber-800';
      case 'Low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5">
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor()}`}>
            {priority}
          </div>
          <h4 className="text-sm font-medium">{title}</h4>
        </div>
      </div>
      <div className="mb-3">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Due on {date}</span>
        </div>
      </div>
      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 w-full">
        View Details
        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export default ActionItem;
