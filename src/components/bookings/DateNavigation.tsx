
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";

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
  const handlePreviousDate = () => {
    if (viewType === "daily") {
      onDateChange(subDays(currentDate, 1));
    } else {
      // For weekly view, go back 7 days from the start of the week
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      onDateChange(subDays(weekStart, 7));
    }
  };

  const handleNextDate = () => {
    if (viewType === "daily") {
      onDateChange(addDays(currentDate, 1));
    } else {
      // For weekly view, go forward 7 days from the start of the week
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      onDateChange(addDays(weekStart, 7));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getDateDisplay = () => {
    if (viewType === "daily") {
      return format(currentDate, "dd MMM yyyy");
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, "dd MMM")} - ${format(weekEnd, "dd MMM yyyy")}`;
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
