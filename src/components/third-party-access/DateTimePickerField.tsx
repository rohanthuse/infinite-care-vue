
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerFieldProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function DateTimePickerField({ date, setDate }: DateTimePickerFieldProps) {
  const [selectedHour, setSelectedHour] = useState<string>(() => {
    return date ? format(date, "HH") : "09";
  });
  
  const [selectedMinute, setSelectedMinute] = useState<string>(() => {
    return date ? format(date, "mm") : "00";
  });

  useEffect(() => {
    if (date) {
      setSelectedHour(format(date, "HH"));
      setSelectedMinute(format(date, "mm"));
    } else {
      setSelectedHour("09");
      setSelectedMinute("00");
    }
  }, [date]);

  // Update the date when hour or minute changes
  useEffect(() => {
    if (date) {
      const updatedDate = new Date(date);
      updatedDate.setHours(parseInt(selectedHour, 10));
      updatedDate.setMinutes(parseInt(selectedMinute, 10));
      setDate(updatedDate);
    }
  }, [selectedHour, selectedMinute]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  const handleSelectDate = (newDate: Date | undefined) => {
    if (newDate) {
      const updatedDate = new Date(newDate);
      updatedDate.setHours(parseInt(selectedHour, 10));
      updatedDate.setMinutes(parseInt(selectedMinute, 10));
      setDate(updatedDate);
    } else {
      setDate(undefined);
    }
  };

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelectDate}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-1 min-w-[120px]">
        <Clock className="h-4 w-4 text-gray-500" />
        <Select
          value={selectedHour}
          onValueChange={setSelectedHour}
        >
          <SelectTrigger className="w-[60px]">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent position="popper" className="h-[200px]">
            {hours.map((hour) => (
              <SelectItem key={hour} value={hour}>{hour}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>:</span>
        <Select
          value={selectedMinute}
          onValueChange={setSelectedMinute}
        >
          <SelectTrigger className="w-[60px]">
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent position="popper" className="h-[200px]">
            {minutes.map((minute) => (
              <SelectItem key={minute} value={minute}>{minute}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
