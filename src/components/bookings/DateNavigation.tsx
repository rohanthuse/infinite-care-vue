
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek, isValid } from "date-fns";

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewType: "daily" | "weekly";
  onViewTypeChange: (viewType: "daily" | "weekly") => void;
}

export const DateNavigation: React.FC<DateNavigationProps> = ({
  currentDate,
  onDateChange,
  viewType,
  onViewTypeChange,
}) => {
  // Ensure we have a valid date
  const validDate = isValid(currentDate) ? currentDate : new Date();

  const handlePreviousDate = () => {
    if (viewType === "daily") {
      onDateChange(subDays(validDate, 1));
    } else {
      // For weekly view, go back 7 days
      onDateChange(subDays(validDate, 7));
    }
  };

  const handleNextDate = () => {
    if (viewType === "daily") {
      onDateChange(addDays(validDate, 1));
    } else {
      // For weekly view, go forward 7 days
      onDateChange(addDays(validDate, 7));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getDateDisplay = () => {
    try {
      if (viewType === "daily") {
        return format(validDate, "dd MMM yyyy");
      } else {
        const weekStart = startOfWeek(validDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(validDate, { weekStartsOn: 1 });
        return `${format(weekStart, "dd MMM")} - ${format(weekEnd, "dd MMM yyyy")}`;
      }
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
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
      
      <div className="flex items-center space-x-1">
        <CalendarIcon className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">
          {getDateDisplay()}
        </span>
      </div>
      
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

      <div className="h-8 border-l border-gray-200 mx-2"></div>
      
      <div className="flex rounded-md overflow-hidden border border-gray-200">
        <Button 
          variant={viewType === "daily" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => onViewTypeChange("daily")}
          className={`h-8 rounded-none text-xs px-3 ${viewType === "daily" ? "bg-blue-600" : "bg-white text-gray-700"}`}
        >
          Daily
        </Button>
        <Button 
          variant={viewType === "weekly" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => onViewTypeChange("weekly")}
          className={`h-8 rounded-none text-xs px-3 ${viewType === "weekly" ? "bg-blue-600" : "bg-white text-gray-700"}`}
        >
          Weekly
        </Button>
      </div>
    </div>
  );
};
