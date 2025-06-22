
import React from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CarerDB } from "@/data/hooks/useBranchCarers";

interface CarerFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  specializationFilter: string;
  onSpecializationFilterChange: (value: string) => void;
  carers: CarerDB[];
}

export const CarerFilters = ({
  statusFilter,
  onStatusFilterChange,
  specializationFilter,
  onSpecializationFilterChange,
  carers
}: CarerFiltersProps) => {
  // Get unique specializations from carers data
  const specializations = Array.from(new Set(carers.map(carer => carer.specialization).filter(Boolean)));

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="w-[180px]">
        <Select 
          value={statusFilter}
          onValueChange={onStatusFilterChange}
        >
          <SelectTrigger className="w-full rounded-md border-gray-200">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectGroup>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending invitation">Pending Invitation</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-[180px]">
        <Select 
          value={specializationFilter}
          onValueChange={onSpecializationFilterChange}
        >
          <SelectTrigger className="w-full rounded-md border-gray-200">
            <SelectValue placeholder="All Specializations" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectGroup>
              <SelectItem value="all">All Specializations</SelectItem>
              {specializations.map((specialization) => (
                <SelectItem key={specialization} value={specialization}>
                  {specialization}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
