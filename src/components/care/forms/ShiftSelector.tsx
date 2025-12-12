import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SHIFT_OPTIONS } from '@/types/serviceAction';

interface ShiftSelectorProps {
  selectedShifts: string[];
  onChange: (shifts: string[]) => void;
  disabled?: boolean;
}

export function ShiftSelector({ selectedShifts, onChange, disabled = false }: ShiftSelectorProps) {
  const handleShiftToggle = (shiftKey: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedShifts, shiftKey]);
    } else {
      onChange(selectedShifts.filter(s => s !== shiftKey));
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      {SHIFT_OPTIONS.map((shift) => (
        <div key={shift.key} className="flex items-center gap-2">
          <Checkbox
            id={`shift-${shift.key}`}
            checked={selectedShifts.includes(shift.key)}
            onCheckedChange={(checked) => handleShiftToggle(shift.key, checked as boolean)}
            disabled={disabled}
          />
          <Label 
            htmlFor={`shift-${shift.key}`} 
            className="text-sm cursor-pointer"
          >
            {shift.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
