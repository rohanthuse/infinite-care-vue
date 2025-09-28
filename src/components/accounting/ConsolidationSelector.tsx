import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileText, Files } from 'lucide-react';
import { consolidationTypeLabels } from '@/types/billing';
import { cn } from '@/lib/utils';

interface ConsolidationSelectorProps {
  selectedType: 'single' | 'split_by_client';
  onTypeChange: (type: 'single' | 'split_by_client') => void;
  className?: string;
  disabled?: boolean;
  clientCount?: number;
}

export const ConsolidationSelector = ({
  selectedType,
  onTypeChange,
  className,
  disabled = false,
  clientCount = 0
}: ConsolidationSelectorProps) => {
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Invoice Format {clientCount > 0 && `(${clientCount} clients)`}
          </Label>
          <RadioGroup
            value={selectedType}
            onValueChange={(value) => onTypeChange(value as 'single' | 'split_by_client')}
            disabled={disabled}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="single" id="single" />
              <Label
                htmlFor="single"
                className="flex items-center gap-2 cursor-pointer text-sm font-normal"
              >
                <FileText className="h-4 w-4 text-blue-600" />
                <div className="flex flex-col">
                  <span className="font-medium">{consolidationTypeLabels.single}</span>
                  <span className="text-xs text-muted-foreground">
                    One invoice with all clients grouped
                  </span>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="split_by_client" id="split_by_client" />
              <Label
                htmlFor="split_by_client"
                className="flex items-center gap-2 cursor-pointer text-sm font-normal"
              >
                <Files className="h-4 w-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="font-medium">{consolidationTypeLabels.split_by_client}</span>
                  <span className="text-xs text-muted-foreground">
                    Separate invoice for each client
                  </span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
};