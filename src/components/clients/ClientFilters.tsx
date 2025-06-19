
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientFiltersProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  regionFilter: string;
  setRegionFilter: (value: string) => void;
}

export const ClientFilters = ({
  searchValue,
  setSearchValue,
  statusFilter,
  setStatusFilter,
  regionFilter,
  setRegionFilter
}: ClientFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[240px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search client name, email or ID" 
            className="pl-10 pr-4 py-2 rounded-md bg-white border-gray-200"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </div>
      
      <div className="w-[180px]">
        <Select 
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-full rounded-md border-gray-200">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectGroup>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="New Enquiries">New Enquiries</SelectItem>
              <SelectItem value="Actively Assessing">Actively Assessing</SelectItem>
              <SelectItem value="Closed Enquiries">Closed Enquiries</SelectItem>
              <SelectItem value="Former">Former</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-[180px]">
        <Select 
          value={regionFilter}
          onValueChange={setRegionFilter}
        >
          <SelectTrigger className="w-full rounded-md border-gray-200">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectGroup>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="North">North</SelectItem>
              <SelectItem value="South">South</SelectItem>
              <SelectItem value="East">East</SelectItem>
              <SelectItem value="West">West</SelectItem>
              <SelectItem value="Central">Central</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
