import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Building2, User, Users } from 'lucide-react';
import { billToTypeLabels } from '@/types/billing';
import { cn } from '@/lib/utils';

interface BillToSelectorProps {
  selectedType: 'authority' | 'private';
  onTypeChange: (type: 'authority' | 'private') => void;
  className?: string;
  disabled?: boolean;
}

export const BillToSelector = ({
  selectedType,
  onTypeChange,
  className,
  disabled = false
}: BillToSelectorProps) => {
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Who should receive the invoice?</Label>
          <RadioGroup
            value={selectedType}
            onValueChange={(value) => onTypeChange(value as 'authority' | 'private')}
            disabled={disabled}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="authority" id="authority" />
              <Label
                htmlFor="authority"
                className="flex items-center gap-2 cursor-pointer text-sm font-normal"
              >
                <Building2 className="h-4 w-4 text-blue-600" />
                <div className="flex flex-col">
                  <span className="font-medium">{billToTypeLabels.authority}</span>
                  <span className="text-xs text-muted-foreground">
                    Invoice sent to funding organization
                  </span>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="private" id="private" />
              <Label
                htmlFor="private"
                className="flex items-center gap-2 cursor-pointer text-sm font-normal"
              >
                <User className="h-4 w-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="font-medium">{billToTypeLabels.private}</span>
                  <span className="text-xs text-muted-foreground">
                    Invoice sent directly to client
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