import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, CalendarDays, CalendarRange, Check, Users, FileText } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type InvoicePeriod = 'weekly' | 'fortnightly' | 'monthly' | 'custom';

export interface PeriodDetails {
  type: InvoicePeriod;
  label: string;
  description: string;
  startDate: string;
  endDate: string;
  days: number;
}

interface InvoicePeriodSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onPeriodSelect: (periodDetails: PeriodDetails) => void;
  onBulkGenerate?: (periodDetails: PeriodDetails) => void;
  branchId?: string;
  organizationId?: string;
  preSelectedClientId?: string;
  preSelectedClientName?: string;
}

export const InvoicePeriodSelector: React.FC<InvoicePeriodSelectorProps> = ({
  isOpen,
  onClose,
  onPeriodSelect,
  onBulkGenerate,
  branchId,
  organizationId,
  preSelectedClientId,
  preSelectedClientName
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<InvoicePeriod | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  // Reset all states when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPeriod(null);
      setShowActions(false);
      setShowCustomDatePicker(false);
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
  }, [isOpen]);

  // Calculate date ranges for each period
  const getPeriodDetails = (periodType: InvoicePeriod): PeriodDetails => {
    const today = new Date();
    let days: number;
    
    switch (periodType) {
      case 'weekly':
        days = 7;
        break;
      case 'fortnightly':
        days = 14;
        break;
      case 'monthly':
        days = 30;
        break;
      case 'custom':
        days = 0; // Will be calculated from custom dates
        break;
    }

    const startDate = subDays(today, days);
    
    return {
      type: periodType,
      label: periodType.charAt(0).toUpperCase() + periodType.slice(1),
      description: `Last ${days} days`,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
      days
    };
  };

  // Validate custom date range
  const validateCustomDates = (): boolean => {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return false;
    }
    
    if (customStartDate > customEndDate) {
      toast.error('Start date must be before or equal to end date');
      return false;
    }
    
    return true;
  };

  // Create period details from custom dates
  const getCustomPeriodDetails = (): PeriodDetails => {
    const startDate = format(customStartDate!, 'yyyy-MM-dd');
    const endDate = format(customEndDate!, 'yyyy-MM-dd');
    const days = Math.ceil((customEndDate!.getTime() - customStartDate!.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      type: 'custom',
      label: 'Custom Range',
      description: `${days} days`,
      startDate,
      endDate,
      days
    };
  };

  const periods: InvoicePeriod[] = ['weekly', 'fortnightly', 'monthly', 'custom'];

  const handlePeriodSelect = (periodType: InvoicePeriod) => {
    setSelectedPeriod(periodType);
    
    // If custom range selected, show date pickers
    if (periodType === 'custom') {
      setShowCustomDatePicker(true);
      return;
    }
    
    // For predefined periods, proceed normally
    if (onBulkGenerate) {
      setShowActions(true);
    } else {
      // If no bulk generate function, proceed directly to manual invoice
      const periodDetails = getPeriodDetails(periodType);
      onPeriodSelect(periodDetails);
    }
  };

  const handleBulkGenerate = () => {
    if (selectedPeriod && onBulkGenerate) {
      const periodDetails = selectedPeriod === 'custom' ? getCustomPeriodDetails() : getPeriodDetails(selectedPeriod);
      onBulkGenerate(periodDetails);
    }
  };

  const handleManualInvoice = () => {
    if (selectedPeriod) {
      const periodDetails = selectedPeriod === 'custom' ? getCustomPeriodDetails() : getPeriodDetails(selectedPeriod);
      onPeriodSelect(periodDetails);
    }
  };

  const handleBack = () => {
    setSelectedPeriod(null);
    setShowActions(false);
  };

  const handleCustomDateConfirm = () => {
    if (!validateCustomDates()) {
      return;
    }
    
    const periodDetails = getCustomPeriodDetails();
    setShowCustomDatePicker(false);
    
    // Proceed to action selection or direct invoice creation
    if (onBulkGenerate) {
      setShowActions(true);
    } else {
      onPeriodSelect(periodDetails);
    }
  };

  const handleBackFromCustom = () => {
    setShowCustomDatePicker(false);
    setSelectedPeriod(null);
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
  };

  const getPeriodIcon = (periodType: InvoicePeriod) => {
    switch (periodType) {
      case 'weekly':
        return <CalendarIcon className="h-8 w-8" />;
      case 'fortnightly':
        return <CalendarDays className="h-8 w-8" />;
      case 'monthly':
        return <CalendarRange className="h-8 w-8" />;
      case 'custom':
        return <CalendarRange className="h-8 w-8" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {showCustomDatePicker 
              ? "Select Date Range" 
              : showActions 
                ? (preSelectedClientId ? `Invoice for ${preSelectedClientName || 'Selected Client'}` : "Choose Action")
                : "Select Invoice Period"}
          </DialogTitle>
          <DialogDescription>
            {showCustomDatePicker
              ? "Select the specific date range for invoice generation"
              : showActions
                ? (preSelectedClientId 
                    ? `Generate invoice for ${preSelectedClientName || 'selected client'} based on completed bookings`
                    : "Generate invoices for all clients or create a manual invoice")
                : "Choose the billing period for this invoice"}
          </DialogDescription>
        </DialogHeader>

        {!showActions && !showCustomDatePicker && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-6">
            {periods.map((periodType) => {
              // For custom period, show special UI
              if (periodType === 'custom') {
                const isSelected = selectedPeriod === 'custom';
                return (
                  <button
                    key="custom"
                    onClick={() => handlePeriodSelect('custom')}
                    className={`relative p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                        <CalendarRange className="h-8 w-8" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          Custom Range
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Select your own dates
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Flexible
                        </Badge>
                      </div>

                      <div className="pt-2 text-xs text-muted-foreground border-t w-full">
                        Choose custom start and end dates
                      </div>
                    </div>
                  </button>
                );
              }

              const details = getPeriodDetails(periodType);
              const isSelected = selectedPeriod === periodType;
              
              return (
                <button
                  key={periodType}
                  onClick={() => handlePeriodSelect(periodType)}
                  className={`relative p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                      {getPeriodIcon(periodType)}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {details.label}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {details.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {details.days} days
                      </Badge>
                    </div>

                    <div className="pt-2 text-xs text-muted-foreground border-t w-full">
                      <div className="font-medium mb-1">Date Range</div>
                      <div>
                        {format(new Date(details.startDate), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-muted-foreground">to</div>
                      <div>
                        {format(new Date(details.endDate), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showCustomDatePicker && (
          <div className="space-y-6 py-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2">Select Date Range</h3>
              <p className="text-sm text-muted-foreground">
                Choose the start and end dates for invoice generation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* From Date */}
              <div className="space-y-2">
                <Label htmlFor="custom-start-date">From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="custom-start-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* To Date */}
              <div className="space-y-2">
                <Label htmlFor="custom-end-date">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="custom-end-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      initialFocus
                      disabled={(date) => customStartDate ? date < customStartDate : false}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Date Range Preview */}
            {customStartDate && customEndDate && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CalendarRange className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Selected Period</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {format(customStartDate, "MMM dd, yyyy")} - {format(customEndDate, "MMM dd, yyyy")}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBackFromCustom}>
                Back
              </Button>
              <Button 
                onClick={handleCustomDateConfirm}
                disabled={!customStartDate || !customEndDate}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {showActions && !showCustomDatePicker && (
          <div className="grid gap-4 py-6">
            {/* Only show "Generate for All Clients" when NO client is pre-selected */}
            {!preSelectedClientId && (
              <Button
                variant="default"
                className="h-24 flex flex-col items-start justify-center gap-2"
                onClick={handleBulkGenerate}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">Generate for All Clients</span>
                </div>
                <span className="text-sm opacity-90">
                  Automatically generate invoices based on completed bookings
                </span>
              </Button>
            )}

            <Button
              variant={preSelectedClientId ? "default" : "outline"}
              className="h-24 flex flex-col items-start justify-center gap-2"
              onClick={handleManualInvoice}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">
                  {preSelectedClientId 
                    ? `Generate Invoice for ${preSelectedClientName || 'Selected Client'}`
                    : 'Create Manual Invoice'}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {preSelectedClientId
                  ? 'Generate invoice based on completed bookings for this client'
                  : 'Select a specific client and create a custom invoice'}
              </span>
            </Button>
          </div>
        )}

        {showActions && !showCustomDatePicker && (
          <DialogFooter>
            <Button variant="ghost" onClick={handleBack}>
              Back to Period Selection
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
