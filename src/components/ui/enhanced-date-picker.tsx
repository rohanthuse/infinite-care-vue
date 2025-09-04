import React, { useState, useEffect } from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EnhancedDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
}

// Helper function to parse flexible date input
const parseFlexibleDate = (input: string): Date | null => {
  if (!input.trim()) return null;
  
  const formats = [
    'dd/MM/yyyy',
    'dd-MM-yyyy', 
    'dd.MM.yyyy',
    'MM/dd/yyyy',
    'MM-dd-yyyy',
    'yyyy-MM-dd',
    'yyyy/MM/dd',
    'd/M/yyyy',
    'd-M-yyyy',
    'M/d/yyyy',
    'M-d-yyyy'
  ];
  
  for (const formatStr of formats) {
    try {
      const parsed = parse(input, formatStr, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch {
      continue;
    }
  }
  
  // Try native Date parsing as fallback
  const nativeDate = new Date(input);
  return isValid(nativeDate) ? nativeDate : null;
};

export function EnhancedDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className
}: EnhancedDatePickerProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Sync input value with prop value
  useEffect(() => {
    if (value) {
      setInputValue(format(value, "dd/MM/yyyy"));
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Try to parse the date as user types
    const parsedDate = parseFlexibleDate(newValue);
    if (parsedDate && (!disabled || !disabled(parsedDate))) {
      onChange(parsedDate);
    } else if (!newValue.trim()) {
      onChange(undefined);
    }
  };

  const handleInputBlur = () => {
    // On blur, if we have a valid date, format it nicely
    if (value) {
      setInputValue(format(value, "dd/MM/yyyy"));
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date);
    setIsOpen(false);
  };

  return (
    <div className={cn("flex", className)}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className="rounded-r-none border-r-0"
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-l-none px-3 border-l-0"
            type="button"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            disabled={disabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}