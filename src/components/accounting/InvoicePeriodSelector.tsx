import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarDays, CalendarRange, Check } from 'lucide-react';
import { format, subDays } from 'date-fns';

export type InvoicePeriod = 'weekly' | 'fortnightly' | 'monthly';

interface PeriodDetails {
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
}

export const InvoicePeriodSelector: React.FC<InvoicePeriodSelectorProps> = ({
  isOpen,
  onClose,
  onPeriodSelect
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<InvoicePeriod | null>(null);

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

  const periods: InvoicePeriod[] = ['weekly', 'fortnightly', 'monthly'];

  const handleContinue = () => {
    if (selectedPeriod) {
      const periodDetails = getPeriodDetails(selectedPeriod);
      onPeriodSelect(periodDetails);
    }
  };

  const getPeriodIcon = (periodType: InvoicePeriod) => {
    switch (periodType) {
      case 'weekly':
        return <Calendar className="h-8 w-8" />;
      case 'fortnightly':
        return <CalendarDays className="h-8 w-8" />;
      case 'monthly':
        return <CalendarRange className="h-8 w-8" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Invoice Period</DialogTitle>
          <DialogDescription>
            Choose the billing period for this invoice
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
          {periods.map((periodType) => {
            const details = getPeriodDetails(periodType);
            const isSelected = selectedPeriod === periodType;
            
            return (
              <button
                key={periodType}
                onClick={() => setSelectedPeriod(periodType)}
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

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedPeriod ? (
              <>Selected: <strong>{selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}</strong> period</>
            ) : (
              'Please select a period to continue'
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleContinue}
              disabled={!selectedPeriod}
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
