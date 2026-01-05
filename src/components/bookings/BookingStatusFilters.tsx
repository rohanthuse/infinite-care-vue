
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
  { id: "assigned", label: "Assigned", color: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200" },
  { id: "unassigned", label: "Unassigned", color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200" },
  { id: "done", label: "Done", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200" },
  { id: "in-progress", label: "In Progress", color: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200" },
  { id: "late", label: "Late Arrival", color: "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200" },
  { id: "missed", label: "Missed", color: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200" },
  { id: "cancelled", label: "Cancelled", color: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200" },
  { id: "departed", label: "Departed", color: "bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200" },
  { id: "suspended", label: "Suspended", color: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200" },
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
      <div className="text-sm font-medium mb-2 text-foreground">Status</div>
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
              className="flex items-center cursor-pointer text-sm text-foreground"
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
