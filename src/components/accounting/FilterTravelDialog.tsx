
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Define filter interface that matches what TravelTab expects
interface TravelTabFilter {
  dateRange: {
    from?: Date;
    to?: Date;
  };
  vehicleTypes: string[];
  status: string[];
  minDistance?: number;
  maxDistance?: number;
  minCost?: number;
  maxCost?: number;
  carerIds?: string[];
  clientNames?: string[];
}

interface FilterTravelDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: TravelTabFilter) => void;
  currentFilters: TravelTabFilter;
}

const vehicleTypeLabels: Record<string, string> = {
  car_personal: "Personal Car",
  car_company: "Company Car", 
  public_transport: "Public Transport",
  taxi: "Taxi",
  other: "Other"
};

const travelStatusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected", 
  reimbursed: "Reimbursed"
};

const FilterTravelDialog: React.FC<FilterTravelDialogProps> = ({
  open,
  onClose,
  onApplyFilters,
  currentFilters,
}) => {
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(
    currentFilters.vehicleTypes || []
  );
  const [status, setStatus] = useState<string[]>(currentFilters.status || []);
  const [dateRange, setDateRange] = useState({
    from: currentFilters.dateRange.from,
    to: currentFilters.dateRange.to,
  });
  const [minDistance, setMinDistance] = useState<number | undefined>(
    currentFilters.minDistance
  );
  const [maxDistance, setMaxDistance] = useState<number | undefined>(
    currentFilters.maxDistance
  );
  const [minCost, setMinCost] = useState<number | undefined>(
    currentFilters.minCost
  );
  const [maxCost, setMaxCost] = useState<number | undefined>(
    currentFilters.maxCost
  );

  // Toggle vehicle type selection
  const toggleVehicleType = (value: string) => {
    setVehicleTypes((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  };

  // Toggle status selection
  const toggleStatus = (value: string) => {
    setStatus((current) =>
      current.includes(value)
        ? current.filter((s) => s !== value)
        : [...current, value]
    );
  };

  // Apply filters
  const handleApplyFilters = () => {
    onApplyFilters({
      vehicleTypes,
      status,
      dateRange,
      minDistance,
      maxDistance,
      minCost,
      maxCost,
    });
    onClose();
  };

  // Reset filters
  const handleResetFilters = () => {
    setVehicleTypes([]);
    setStatus([]);
    setDateRange({ from: undefined, to: undefined });
    setMinDistance(undefined);
    setMaxDistance(undefined);
    setMinCost(undefined);
    setMaxCost(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Filter Travel Records</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 lg:px-3"
              onClick={handleResetFilters}
            >
              Reset
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Date Range */}
          <div className="space-y-4">
            <h3 className="font-medium">Date Range</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="grid gap-2 flex-1">
                <Label htmlFor="from">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="from"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        format(dateRange.from, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) =>
                        setDateRange((prev) => ({ ...prev, from: date }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2 flex-1">
                <Label htmlFor="to">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="to"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? (
                        format(dateRange.to, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) =>
                        setDateRange((prev) => ({ ...prev, to: date }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="space-y-4">
            <h3 className="font-medium">Vehicle Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`vehicle-${value}`}
                    checked={vehicleTypes.includes(value)}
                    onCheckedChange={() => toggleVehicleType(value)}
                  />
                  <Label
                    htmlFor={`vehicle-${value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="font-medium">Status</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(travelStatusLabels).map(([value, label]) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${value}`}
                    checked={status.includes(value)}
                    onCheckedChange={() => toggleStatus(value)}
                  />
                  <Label
                    htmlFor={`status-${value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Distance Range */}
          <div className="space-y-4">
            <h3 className="font-medium">Distance Range (miles)</h3>
            <div className="flex gap-4">
              <div className="grid gap-2 flex-1">
                <Label htmlFor="minDistance">Min</Label>
                <Input
                  id="minDistance"
                  type="number"
                  placeholder="Min distance"
                  value={minDistance !== undefined ? minDistance : ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setMinDistance(value);
                  }}
                />
              </div>
              <div className="grid gap-2 flex-1">
                <Label htmlFor="maxDistance">Max</Label>
                <Input
                  id="maxDistance"
                  type="number"
                  placeholder="Max distance"
                  value={maxDistance !== undefined ? maxDistance : ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setMaxDistance(value);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Cost Range */}
          <div className="space-y-4">
            <h3 className="font-medium">Cost Range (£)</h3>
            <div className="flex gap-4">
              <div className="grid gap-2 flex-1">
                <Label htmlFor="minCost">Min</Label>
                <Input
                  id="minCost"
                  type="number"
                  step="0.01"
                  placeholder="Min cost"
                  value={minCost !== undefined ? minCost : ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setMinCost(value);
                  }}
                />
              </div>
              <div className="grid gap-2 flex-1">
                <Label htmlFor="maxCost">Max</Label>
                <Input
                  id="maxCost"
                  type="number"
                  step="0.01"
                  placeholder="Max cost"
                  value={maxCost !== undefined ? maxCost : ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setMaxCost(value);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterTravelDialog;
