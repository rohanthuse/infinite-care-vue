import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  viewMode,
  onViewModeChange,
  selectedStatuses,
  onStatusChange
}) => {
  return <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search clients or carers..." className="pl-9 h-9" value={searchQuery} onChange={e => onSearchChange(e.target.value)} />
        </div>
        
        <RadioGroup value={viewMode} onValueChange={value => onViewModeChange(value as "client" | "group")} className="flex space-x-4">
          
          
        </RadioGroup>
      </div>
      
      <BookingStatusFilters selectedStatuses={selectedStatuses} onStatusChange={onStatusChange} />
    </div>;
};