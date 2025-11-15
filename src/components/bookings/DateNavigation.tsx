
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek, isValid, addMonths, subMonths, parse } from "date-fns";
import { cn } from "@/lib/utils";

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewType: "daily" | "weekly" | "monthly";
  onViewTypeChange: (viewType: "daily" | "weekly" | "monthly") => void;
}

export const DateNavigation: React.FC<DateNavigationProps> = ({
  currentDate,
  onDateChange,
  viewType,
  onViewTypeChange,
}) => {
  // Ensure we have a valid date
  const validDate = isValid(currentDate) ? currentDate : new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Parse flexible date input
  const parseFlexibleDate = (input: string): Date | null => {
    if (!input.trim()) return null;
    
    // Try various date formats
    const formats = [
      'yyyy-MM-dd',
      'dd/MM/yyyy',
      'MM/dd/yyyy',
      'dd-MM-yyyy',
      'dd MMM yyyy',
      'MMM dd yyyy',
      'dd/MM/yy',
      'MM/dd/yy'
    ];
    
    for (const formatStr of formats) {
      try {
        const parsed = parse(input, formatStr, new Date());
        if (isValid(parsed)) {
          return parsed;
        }
      } catch (error) {
        // Continue to next format
      }
    }
    
    // Try native Date parsing as fallback
    try {
      const nativeDate = new Date(input);
      if (isValid(nativeDate)) {
        return nativeDate;
      }
    } catch (error) {
      // Ignore
    }
    
    return null;
  };

  const handlePreviousDate = () => {
    if (viewType === "daily") {
      onDateChange(subDays(validDate, 1));
    } else if (viewType === "weekly") {
      onDateChange(subDays(validDate, 7));
    } else {
      // For monthly view, go back 1 month
      onDateChange(subMonths(validDate, 1));
    }
  };

  const handleNextDate = () => {
    if (viewType === "daily") {
      onDateChange(addDays(validDate, 1));
    } else if (viewType === "weekly") {
      onDateChange(addDays(validDate, 7));
    } else {
      // For monthly view, go forward 1 month
      onDateChange(addMonths(validDate, 1));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getDateDisplay = () => {
    try {
      if (viewType === "daily") {
        return format(validDate, "EEEE, dd MMM yyyy");
      } else if (viewType === "weekly") {
        const weekStart = startOfWeek(validDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(validDate, { weekStartsOn: 1 });
        return `${format(weekStart, "dd MMM")} - ${format(weekEnd, "dd MMM yyyy")}`;
      } else {
        // Monthly view
        return format(validDate, "MMMM yyyy");
      }
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const parsed = parseFlexibleDate(value);
    if (parsed) {
      onDateChange(parsed);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setIsOpen(false);
      setInputValue("");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setInputValue(format(validDate, "yyyy-MM-dd"));
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handlePreviousDate}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-8 justify-start text-left font-normal hover:bg-accent hover:text-accent-foreground",
              "text-sm font-medium"
            )}
          >
            <CalendarIcon className="h-4 w-4 mr-1 text-muted-foreground" />
            {getDateDisplay()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            <Input
              placeholder="Enter date (e.g., 2024-01-15, 15/01/2024)"
              value={inputValue}
              onChange={handleInputChange}
              className="text-sm"
            />
            <Calendar
              mode="single"
              selected={validDate}
              onSelect={handleCalendarSelect}
              initialFocus
              className={cn("p-0 pointer-events-auto")}
            />
          </div>
        </PopoverContent>
      </Popover>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleNextDate}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleToday}
        className="h-8 text-xs"
      >
        Today
      </Button>

      <div className="h-8 border-l border-border mx-2"></div>
      
      <div className="flex rounded-md overflow-hidden border border-border bg-background">
        <Button 
          variant={viewType === "daily" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => onViewTypeChange("daily")}
          className="h-8 rounded-none text-xs px-3"
        >
          Daily
        </Button>
        <Button 
          variant={viewType === "weekly" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => onViewTypeChange("weekly")}
          className="h-8 rounded-none text-xs px-3"
        >
          Weekly
        </Button>
        <Button 
          variant={viewType === "monthly" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => onViewTypeChange("monthly")}
          className="h-8 rounded-none text-xs px-3"
        >
          Monthly
        </Button>
      </div>
    </div>
  );
};
