
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { BookingStatusFilters } from "./BookingStatusFilters";

interface BookingFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "client" | "group";
  onViewModeChange: (mode: "client" | "group") => void;
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
}

export const BookingFilters: React.FC<BookingFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedStatuses,
  onStatusChange
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search clients or carers..." 
            className="pl-9 h-9" 
            value={searchQuery} 
            onChange={handleSearchChange} 
          />
        </div>
      </div>
      
      <BookingStatusFilters 
        selectedStatuses={selectedStatuses} 
        onStatusChange={onStatusChange} 
      />
    </div>
  );
};
