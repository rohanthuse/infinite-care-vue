import React, { useState, useEffect, useRef } from "react";
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
  const [hasError, setHasError] = useState(false);
  const lastExternalValueRef = useRef<Date | undefined>(undefined);

  // Sync input value with prop value - only when external value changes
  useEffect(() => {
    // Check if the external value actually changed (not from our own onChange)
    const externalChanged = value !== lastExternalValueRef.current;
    
    if (externalChanged) {
      if (value) {
        setInputValue(format(value, "dd/MM/yyyy"));
        setHasError(false);
      } else {
        setInputValue("");
        setHasError(false);
      }
      lastExternalValueRef.current = value;
    }
  }, [value]);

  const attemptParsing = () => {
    if (!inputValue.trim()) {
      onChange(undefined);
      setHasError(false);
      lastExternalValueRef.current = undefined;
      return;
    }

    const parsedDate = parseFlexibleDate(inputValue);
    
    if (parsedDate) {
      if (disabled && disabled(parsedDate)) {
        // Date is disabled (e.g., before fromDate)
        setHasError(true);
      } else {
        setHasError(false);
        onChange(parsedDate);
        setInputValue(format(parsedDate, "dd/MM/yyyy"));
        lastExternalValueRef.current = parsedDate;
      }
    } else {
      // Invalid format - show error but keep input for user to fix
      setHasError(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHasError(false); // Clear error while typing
    
    // Only clear the value if input is empty
    if (!newValue.trim()) {
      onChange(undefined);
      lastExternalValueRef.current = undefined;
    }
  };

  const handleInputBlur = () => {
    attemptParsing();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      attemptParsing();
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date);
    lastExternalValueRef.current = date;
    setHasError(false);
    setIsOpen(false);
  };

  return (
    <div className={cn("flex", className)}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "rounded-r-none border-r-0",
          hasError && "border-destructive focus-visible:ring-destructive"
        )}
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
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
