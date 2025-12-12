import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DAYS_OF_WEEK } from '@/types/servicePlan';

interface DaySelectorProps {
  selectedDays: string[];
  onChange: (days: string[]) => void;
  disabled?: boolean;
}

export function DaySelector({ selectedDays, onChange, disabled = false }: DaySelectorProps) {
  const allDaysSelected = DAYS_OF_WEEK.every(day => selectedDays.includes(day.key));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onChange(DAYS_OF_WEEK.map(d => d.key));
    } else {
      onChange([]);
    }
  };

  const handleDayToggle = (dayKey: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedDays, dayKey]);
    } else {
      onChange(selectedDays.filter(d => d !== dayKey));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id="select-all-days"
          checked={allDaysSelected}
          onCheckedChange={handleSelectAll}
          disabled={disabled}
        />
        <Label 
          htmlFor="select-all-days" 
          className="text-sm font-medium cursor-pointer"
        >
          Select All Days
        </Label>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day.key} className="flex items-center gap-1.5">
            <Checkbox
              id={`day-${day.key}`}
              checked={selectedDays.includes(day.key)}
              onCheckedChange={(checked) => handleDayToggle(day.key, checked as boolean)}
              disabled={disabled}
            />
            <Label 
              htmlFor={`day-${day.key}`} 
              className="text-sm cursor-pointer"
            >
              {day.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
