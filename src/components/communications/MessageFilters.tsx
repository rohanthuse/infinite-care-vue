
import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageFiltersProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  priorityFilter?: string;
  readFilter?: string;
  dateFilter?: string;
  onFilterOptionsChange?: (priority?: string, readStatus?: string, date?: string) => void;
}

export const MessageFilters = ({ 
  selectedFilter, 
  onFilterChange,
  priorityFilter,
  readFilter,
  dateFilter,
  onFilterOptionsChange 
}: MessageFiltersProps) => {
  const handlePriorityChange = (value: string) => {
    if (onFilterOptionsChange) {
      onFilterOptionsChange(value, readFilter, dateFilter);
    }
  };

  const handleReadStatusChange = (value: string) => {
    if (onFilterOptionsChange) {
      onFilterOptionsChange(priorityFilter, value, dateFilter);
    }
  };

  const handleDateFilterChange = (value: string) => {
    if (onFilterOptionsChange) {
      onFilterOptionsChange(priorityFilter, readFilter, value);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex-1">
          {/* Empty space for alignment */}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Message Status</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={readFilter} onValueChange={handleReadStatusChange}>
              <DropdownMenuRadioItem value="all">All Messages</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="read">Read</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="unread">Unread</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>Priority</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={priorityFilter} onValueChange={handlePriorityChange}>
              <DropdownMenuRadioItem value="all">All Priorities</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>Date Range</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={dateFilter} onValueChange={handleDateFilterChange}>
              <DropdownMenuRadioItem value="all">All Time</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="today">Today</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="week">This Week</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="month">This Month</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="w-full flex overflow-hidden bg-muted rounded-md">
        <button 
          className={`flex-1 text-sm py-2 px-4 ${selectedFilter === 'all' ? 'bg-background rounded-md shadow-sm' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          All
        </button>
        <button 
          className={`flex-1 text-sm py-2 px-4 ${selectedFilter === 'carers' ? 'bg-background rounded-md shadow-sm' : ''}`}
          onClick={() => onFilterChange('carers')}
        >
          Carers
        </button>
        <button 
          className={`flex-1 text-sm py-2 px-4 ${selectedFilter === 'clients' ? 'bg-background rounded-md shadow-sm' : ''}`}
          onClick={() => onFilterChange('clients')}
        >
          Clients
        </button>
        <button 
          className={`flex-1 text-sm py-2 px-4 ${selectedFilter === 'groups' ? 'bg-background rounded-md shadow-sm' : ''}`}
          onClick={() => onFilterChange('groups')}
        >
          Groups
        </button>
      </div>
    </div>
  );
};
