
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  RateType, rateTypeLabels, 
  ClientType, clientTypeLabels,
  FundingSource, fundingSourceLabels,
  RateStatus, rateStatusLabels, 
  RateFilter
} from "@/types/rate";
import { Checkbox } from "@/components/ui/checkbox";

interface FilterRateDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: RateFilter) => void;
  initialFilters?: RateFilter;
  serviceNames: string[];
}

const FilterRateDialog: React.FC<FilterRateDialogProps> = ({
  open,
  onClose,
  onApplyFilters,
  initialFilters,
  serviceNames
}) => {
  const [filters, setFilters] = useState<RateFilter>(
    initialFilters || {
      serviceNames: [],
      rateTypes: [],
      clientTypes: [],
      fundingSources: [],
      statuses: [],
      dateRange: {},
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

  // Handle checkbox toggle for arrays
  const handleToggle = <T extends string>(
    field: keyof Pick<RateFilter, 'serviceNames' | 'rateTypes' | 'clientTypes' | 'fundingSources' | 'statuses'>,
    value: T
  ) => {
    setFilters((prev) => {
      const currentValues = prev[field] as T[] || [];
      const isSelected = currentValues.includes(value);
      
      if (isSelected) {
        return {
          ...prev,
          [field]: currentValues.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [field]: [...currentValues, value]
        };
      }
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
      serviceNames: [],
      rateTypes: [],
      clientTypes: [],
      fundingSources: [],
      statuses: [],
      dateRange: {},
      minAmount: undefined,
      maxAmount: undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Rates</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Service filter */}
          {serviceNames.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              <h3 className="font-medium text-sm">Services</h3>
              <div className="grid grid-cols-2 gap-3">
                {serviceNames.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${service}`}
                      checked={(filters.serviceNames || []).includes(service)}
                      onCheckedChange={() => handleToggle('serviceNames', service)}
                    />
                    <Label htmlFor={`service-${service}`} className="cursor-pointer">
                      {service}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rate types filter */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-medium text-sm">Rate Types</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(rateTypeLabels).map(([type, label]) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rateType-${type}`}
                    checked={(filters.rateTypes || []).includes(type as RateType)}
                    onCheckedChange={() => handleToggle('rateTypes', type as RateType)}
                  />
                  <Label htmlFor={`rateType-${type}`} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Client types filter */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-medium text-sm">Client Types</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(clientTypeLabels).map(([type, label]) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`clientType-${type}`}
                    checked={(filters.clientTypes || []).includes(type as ClientType)}
                    onCheckedChange={() => handleToggle('clientTypes', type as ClientType)}
                  />
                  <Label htmlFor={`clientType-${type}`} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Funding sources filter */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-medium text-sm">Funding Sources</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(fundingSourceLabels).map(([type, label]) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`fundingSource-${type}`}
                    checked={(filters.fundingSources || []).includes(type as FundingSource)}
                    onCheckedChange={() => handleToggle('fundingSources', type as FundingSource)}
                  />
                  <Label htmlFor={`fundingSource-${type}`} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-medium text-sm">Status</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(rateStatusLabels).map(([status, label]) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={(filters.statuses || []).includes(status as RateStatus)}
                    onCheckedChange={() => handleToggle('statuses', status as RateStatus)}
                  />
                  <Label htmlFor={`status-${status}`} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Date range filter */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-medium text-sm">Effective Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateRange?.from?.toISOString().split('T')[0] || ""}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateRange?.to?.toISOString().split('T')[0] || ""}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Amount range filter */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-medium text-sm">Amount Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Minimum (£)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  value={filters.minAmount !== undefined ? filters.minAmount : ""}
                  onChange={(e) => handleNumericChange("minAmount", e.target.value)}
                  placeholder="Min amount"
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

export default FilterRateDialog;
