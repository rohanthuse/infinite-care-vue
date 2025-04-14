
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PaymentStatus, paymentStatusLabels, PayrollFilter } from "@/types/payroll";
import { Checkbox } from "@/components/ui/checkbox";

interface FilterPayrollDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: PayrollFilter) => void;
  initialFilters?: PayrollFilter;
}

const FilterPayrollDialog: React.FC<FilterPayrollDialogProps> = ({
  open,
  onClose,
  onApplyFilters,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<PayrollFilter>(
    initialFilters || {
      dateRange: {},
      paymentStatuses: [],
      minGrossPay: undefined,
      maxGrossPay: undefined,
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
  const handleStatusToggle = (status: PaymentStatus) => {
    setFilters((prev) => {
      const isSelected = prev.paymentStatuses.includes(status);
      let newStatuses: PaymentStatus[];

      if (isSelected) {
        newStatuses = prev.paymentStatuses.filter(s => s !== status);
      } else {
        newStatuses = [...prev.paymentStatuses, status];
      }

      return {
        ...prev,
        paymentStatuses: newStatuses,
      };
    });
  };

  // Handle numeric input change
  const handleNumericChange = (field: "minGrossPay" | "maxGrossPay", value: string) => {
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
      paymentStatuses: [],
      minGrossPay: undefined,
      maxGrossPay: undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Payroll Records</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Date range filter */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-medium text-sm">Payment Date Range</h3>
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
            <h3 className="font-medium text-sm">Payment Status</h3>
            <div className="grid grid-cols-2 gap-3">
              {(["pending", "processed", "failed", "cancelled"] as PaymentStatus[]).map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.paymentStatuses.includes(status)}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <Label htmlFor={`status-${status}`} className="cursor-pointer">
                    {paymentStatusLabels[status]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Amount range filter */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-medium text-sm">Gross Pay Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minGrossPay">Minimum (£)</Label>
                <Input
                  id="minGrossPay"
                  type="number"
                  value={filters.minGrossPay !== undefined ? filters.minGrossPay : ""}
                  onChange={(e) => handleNumericChange("minGrossPay", e.target.value)}
                  placeholder="Min amount"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxGrossPay">Maximum (£)</Label>
                <Input
                  id="maxGrossPay"
                  type="number"
                  value={filters.maxGrossPay !== undefined ? filters.maxGrossPay : ""}
                  onChange={(e) => handleNumericChange("maxGrossPay", e.target.value)}
                  placeholder="Max amount"
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

export default FilterPayrollDialog;
