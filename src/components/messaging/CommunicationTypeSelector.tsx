
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCommunicationTypeOptions } from '@/hooks/useParameterOptions';

interface CommunicationTypeSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CommunicationTypeSelector: React.FC<CommunicationTypeSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Select communication type",
  disabled = false,
}) => {
  const { data: communicationTypeOptions = [], isLoading } = useCommunicationTypeOptions();

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange} 
      disabled={disabled || isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {communicationTypeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
