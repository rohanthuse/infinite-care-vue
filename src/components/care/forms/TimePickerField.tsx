import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';

interface TimePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TimePickerField({ 
  value, 
  onChange, 
  label, 
  required = false,
  disabled = false,
  className = ''
}: TimePickerFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
}
