
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface BookingStatus {
  id: string;
  label: string;
  color: string;
}

const statuses: BookingStatus[] = [
  { id: "assigned", label: "Assigned", color: "bg-green-100 text-green-800" },
  { id: "unassigned", label: "Unassigned", color: "bg-amber-100 text-amber-800" },
  { id: "done", label: "Done", color: "bg-blue-100 text-blue-800" },
  { id: "in-progress", label: "In Progress", color: "bg-purple-100 text-purple-800" },
  { id: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
  { id: "departed", label: "Departed", color: "bg-teal-100 text-teal-800" },
  { id: "suspended", label: "Suspended", color: "bg-gray-100 text-gray-800" },
];

interface BookingStatusFiltersProps {
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  statusCounts?: Record<string, number>;
}

export const BookingStatusFilters: React.FC<BookingStatusFiltersProps> = ({
  selectedStatuses,
  onStatusChange,
  statusCounts = {},
}) => {
  const handleStatusChange = (statusId: string) => {
    if (selectedStatuses.includes(statusId)) {
      onStatusChange(selectedStatuses.filter(id => id !== statusId));
    } else {
      onStatusChange([...selectedStatuses, statusId]);
    }
  };

  return (
    <div>
      <div className="text-sm font-medium mb-2">Status</div>
      <div className="flex flex-wrap gap-3">
        {statuses.map((status) => (
          <div key={status.id} className="flex items-center space-x-2">
            <Checkbox 
              id={`status-${status.id}`} 
              checked={selectedStatuses.includes(status.id)}
              onCheckedChange={() => handleStatusChange(status.id)}
              className="h-4 w-4"
            />
            <Label 
              htmlFor={`status-${status.id}`}
              className="flex items-center cursor-pointer text-sm"
            >
              {status.label}
              <Badge className={`ml-1.5 ${status.color} font-normal text-xs`} variant="outline">
                {statusCounts[status.id] ?? 0}
              </Badge>
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};
