
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CarerDB } from "@/data/hooks/useBranchCarers";

interface StatusFilterStatsProps {
  carers: CarerDB[];
  currentFilter: string;
}

export const StatusFilterStats = ({ carers, currentFilter }: StatusFilterStatsProps) => {
  const statusCounts = carers.reduce((acc, carer) => {
    const status = carer.status || "Active";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allStatuses = ["Active", "Inactive", "Pending Invitation", "On Leave", "Training"];
  
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span>Status counts:</span>
      {allStatuses.map(status => {
        const count = statusCounts[status] || 0;
        const isActive = currentFilter === status.toLowerCase().replace(/\s+/g, '-');
        
        return (
          <Badge 
            key={status}
            variant={isActive ? "default" : "outline"}
            className={`text-xs ${isActive ? 'bg-blue-600' : ''}`}
          >
            {status}: {count}
          </Badge>
        );
      })}
    </div>
  );
};
