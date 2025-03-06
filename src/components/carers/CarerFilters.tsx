
import React from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CarerFiltersProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  specializationFilter: string;
  setSpecializationFilter: (value: string) => void;
  availabilityFilter: string;
  setAvailabilityFilter: (value: string) => void;
}

export const CarerFilters = ({
  searchValue,
  setSearchValue,
  statusFilter,
  setStatusFilter,
  specializationFilter,
  setSpecializationFilter,
  availabilityFilter,
  setAvailabilityFilter
}: CarerFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[240px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search carer name, email or ID" 
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
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="On Leave">On Leave</SelectItem>
              <SelectItem value="Training">Training</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-[180px]">
        <Select 
          value={specializationFilter}
          onValueChange={setSpecializationFilter}
        >
          <SelectTrigger className="w-full rounded-md border-gray-200">
            <SelectValue placeholder="All Specializations" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectGroup>
              <SelectItem value="all">All Specializations</SelectItem>
              <SelectItem value="Home Care">Home Care</SelectItem>
              <SelectItem value="Elderly Care">Elderly Care</SelectItem>
              <SelectItem value="Nurse">Nurse</SelectItem>
              <SelectItem value="Physiotherapy">Physiotherapy</SelectItem>
              <SelectItem value="Mental Health">Mental Health</SelectItem>
              <SelectItem value="Disability Support">Disability Support</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-[180px]">
        <Select 
          value={availabilityFilter}
          onValueChange={setAvailabilityFilter}
        >
          <SelectTrigger className="w-full rounded-md border-gray-200">
            <SelectValue placeholder="All Availability" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectGroup>
              <SelectItem value="all">All Availability</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
