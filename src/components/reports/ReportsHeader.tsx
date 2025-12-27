
import React, { useState } from "react";
import {
  Calendar,
  Download,
  FileText,
  Filter,
  MoreHorizontal,
  Save,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "sonner";

export function ReportsHeader() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const handleExport = (format: string) => {
    toast.success(`Report exported as ${format}`);
  };

  const handleSaveReport = () => {
    toast.success("Report saved successfully");
  };

  const handleShareReport = () => {
    toast.success("Sharing options opened");
  };

  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 bg-card p-4 border border-border rounded-lg shadow-sm">
      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Filter Reports</h4>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Filters will be specific to the selected report type.
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Calendar className="h-4 w-4 mr-2" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Date Range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto" align="start">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport("PDF")}>
              <FileText className="h-4 w-4 mr-2" />
              <span>Export as PDF</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("Excel")}>
              <FileText className="h-4 w-4 mr-2" />
              <span>Export as Excel</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("CSV")}>
              <FileText className="h-4 w-4 mr-2" />
              <span>Export as CSV</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSaveReport}>
              <Save className="h-4 w-4 mr-2" />
              <span>Save Report</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShareReport}>
              <Share2 className="h-4 w-4 mr-2" />
              <span>Share Report</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
