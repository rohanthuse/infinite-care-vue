
import React, { useState } from "react";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [localPriorityFilter, setLocalPriorityFilter] = useState<string | undefined>(priorityFilter || "all");
  const [localReadFilter, setLocalReadFilter] = useState<string | undefined>(readFilter || "all");
  const [localDateFilter, setLocalDateFilter] = useState<string | undefined>(dateFilter || "all");

  const handlePriorityChange = (value: string) => {
    setLocalPriorityFilter(value);
    if (onFilterOptionsChange) {
      onFilterOptionsChange(value, localReadFilter, localDateFilter);
    }
  };

  const handleReadStatusChange = (value: string) => {
    setLocalReadFilter(value);
    if (onFilterOptionsChange) {
      onFilterOptionsChange(localPriorityFilter, value, localDateFilter);
    }
  };

  const handleDateFilterChange = (value: string) => {
    setLocalDateFilter(value);
    if (onFilterOptionsChange) {
      onFilterOptionsChange(localPriorityFilter, localReadFilter, value);
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Messages</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Message Status</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={localReadFilter} onValueChange={handleReadStatusChange}>
              <DropdownMenuRadioItem value="all">All Messages</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="read">Read</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="unread">Unread</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>Priority</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={localPriorityFilter} onValueChange={handlePriorityChange}>
              <DropdownMenuRadioItem value="all">All Priorities</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>Date Range</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={localDateFilter} onValueChange={handleDateFilterChange}>
              <DropdownMenuRadioItem value="all">All Time</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="today">Today</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="week">This Week</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="month">This Month</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Tabs value={selectedFilter} onValueChange={onFilterChange} className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="carers">Carers</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
