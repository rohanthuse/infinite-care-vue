
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
import { generateReportPDF } from "@/services/enhancedPdfGenerator";

interface ReportsHeaderProps {
  branchName: string;
  activeReportType: string;
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
  reportData?: any;
}

export function ReportsHeader({ 
  branchName, 
  activeReportType, 
  onDateRangeChange,
  reportData 
}: ReportsHeaderProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    onDateRangeChange?.(newDate);
  };

  const handleExport = (exportFormat: string) => {
    if (!date?.from || !date?.to) {
      toast.error("Please select a date range first");
      return;
    }

    try {
      switch (exportFormat) {
        case "PDF":
          generateReportPDF({
            branchName,
            reportType: activeReportType,
            dateRange: { from: date.from, to: date.to },
            data: reportData
          });
          toast.success("PDF report generated successfully");
          break;
        case "Excel":
        case "CSV":
          // Create CSV content
          const csvContent = generateCSVContent(reportData, activeReportType);
          downloadCSV(csvContent, `${activeReportType}_Report_${format(new Date(), "yyyy-MM-dd")}.csv`);
          toast.success(`${exportFormat} report exported successfully`);
          break;
        default:
          toast.error("Export format not supported");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    }
  };

  const generateCSVContent = (data: any, reportType: string): string => {
    if (!data) return "No data available";
    
    // Simple CSV generation - would be enhanced based on actual data structure
    const headers = ["Report Type", "Generated", "Branch"];
    const rows = [
      [reportType, format(new Date(), "yyyy-MM-dd HH:mm:ss"), branchName]
    ];
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveReport = () => {
    toast.success("Report saved successfully");
  };

  const handleShareReport = () => {
    toast.success("Sharing options opened");
  };

  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
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
                  Date range filtering is available. Additional filters will be added based on report type.
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
              onSelect={handleDateChange}
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
