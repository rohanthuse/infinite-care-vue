
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type ExtraTimeStatus = 'pending' | 'approved' | 'rejected';

interface ExtraTimeFilter {
  dateRange: { from?: Date; to?: Date };
  statuses: ExtraTimeStatus[];
  minAmount?: number;
  maxAmount?: number;
}

const extraTimeStatusLabels: Record<ExtraTimeStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected"
};

interface FilterExtraTimeDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ExtraTimeFilter) => void;
  currentFilters?: ExtraTimeFilter;
}

const FilterExtraTimeDialog: React.FC<FilterExtraTimeDialogProps> = ({
  open,
  onClose,
  onApplyFilters,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<ExtraTimeFilter>(
    currentFilters || {
      dateRange: {},
      statuses: [],
      minAmount: undefined,
      maxAmount: undefined,
    }
  );

  // Handle date change
  const handleDateChange = (field: "from" | "to", value: string) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value ? new Date(value) : undefined,
      },
    }));
  };

  // Handle status toggle
  const handleStatusToggle = (status: ExtraTimeStatus) => {
    setFilters((prev) => {
      const isSelected = prev.statuses.includes(status);
      let newStatuses: ExtraTimeStatus[];

      if (isSelected) {
        newStatuses = prev.statuses.filter(s => s !== status);
      } else {
        newStatuses = [...prev.statuses, status];
      }

      return {
        ...prev,
        statuses: newStatuses,
      };
    });
  };

  // Handle numeric input change
  const handleNumericChange = (field: "minAmount" | "maxAmount", value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    
    setFilters((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      dateRange: {},
      statuses: [],
      minAmount: undefined,
      maxAmount: undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Extra Time Records</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Date range filter */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-medium text-sm">Work Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateRange.from?.toISOString().split('T')[0] || ""}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateRange.to?.toISOString().split('T')[0] || ""}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Status filter */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-medium text-sm">Status</h3>
            <div className="grid grid-cols-1 gap-3">
              {(["pending", "approved", "rejected"] as ExtraTimeStatus[]).map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.statuses.includes(status)}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <Label htmlFor={`status-${status}`} className="cursor-pointer">
                    {extraTimeStatusLabels[status]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Amount range filter */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-medium text-sm">Cost Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Minimum (£)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  value={filters.minAmount !== undefined ? filters.minAmount : ""}
                  onChange={(e) => handleNumericChange("minAmount", e.target.value)}
                  placeholder="Min cost"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Maximum (£)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  value={filters.maxAmount !== undefined ? filters.maxAmount : ""}
                  onChange={(e) => handleNumericChange("maxAmount", e.target.value)}
                  placeholder="Max cost"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            type="button" 
            onClick={handleResetFilters}
          >
            Reset Filters
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterExtraTimeDialog;
