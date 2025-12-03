import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Sheet } from "lucide-react";
import {
  generateComprehensiveAttendancePDF,
  generateAttendanceExcel,
  downloadPDF,
  downloadExcel,
} from "@/lib/attendanceReportGenerator";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";

interface AttendanceRecord {
  staffName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hours: number | null;
  status: string;
}

interface AttendanceExportDropdownProps {
  branchId: string;
  branchName: string;
  currentDate: Date;
  attendanceData: AttendanceRecord[];
  totalHours: number;
  attendanceRate: number;
  absentDays: number;
  lateDays: number;
}

export const AttendanceExportDropdown: React.FC<AttendanceExportDropdownProps> = ({
  branchId,
  branchName,
  currentDate,
  attendanceData,
  totalHours,
  attendanceRate,
  absentDays,
  lateDays,
}) => {
  const generateReport = async (
    type: "daily" | "weekly" | "monthly",
    reportFormat: "pdf" | "excel"
  ) => {
    let startDate: Date;
    let endDate: Date;

    switch (type) {
      case "daily":
        startDate = startOfDay(currentDate);
        endDate = endOfDay(currentDate);
        break;
      case "weekly":
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
        endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
        break;
      case "monthly":
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        break;
      default:
        return;
    }

    const filename = `attendance_${type}_${format(startDate, "yyyy-MM-dd")}`;

    try {
      if (reportFormat === "pdf") {
        toast.loading("Generating comprehensive PDF report...", { id: "pdf-generation" });
        
        // Use the new comprehensive PDF generator that fetches all staff and leave data
        const doc = await generateComprehensiveAttendancePDF(
          branchId,
          branchName,
          startDate,
          endDate,
          type
        );
        
        downloadPDF(doc, `${filename}.pdf`);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} PDF report generated successfully`, { id: "pdf-generation" });
      } else {
        // Excel export uses existing data
        const reportData = attendanceData.filter((record) => {
          const recordDate = new Date(record.date);
          return recordDate >= startDate && recordDate <= endDate;
        });

        const presentDays = reportData.filter(
          (r) => r.status.toLowerCase() === "present" || r.status.toLowerCase() === "late"
        ).length;

        const summary = {
          totalWorkingDays: reportData.length,
          totalHours,
          presentDays,
          absentDays,
          lateDays,
          attendanceRate,
        };

        const metadata = {
          branchName,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reportType: type,
        };

        const csv = generateAttendanceExcel(reportData, metadata, summary);
        downloadExcel(csv, `${filename}.csv`);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} Excel report generated`);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report. Please try again.", { id: "pdf-generation" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Daily Reports</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => generateReport("daily", "pdf")}>
          <FileText className="mr-2 h-4 w-4" />
          Daily Report (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generateReport("daily", "excel")}>
          <Sheet className="mr-2 h-4 w-4" />
          Daily Report (Excel)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Weekly Reports</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => generateReport("weekly", "pdf")}>
          <FileText className="mr-2 h-4 w-4" />
          Weekly Report (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generateReport("weekly", "excel")}>
          <Sheet className="mr-2 h-4 w-4" />
          Weekly Report (Excel)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Monthly Reports</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => generateReport("monthly", "pdf")}>
          <FileText className="mr-2 h-4 w-4" />
          Monthly Report (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generateReport("monthly", "excel")}>
          <Sheet className="mr-2 h-4 w-4" />
          Monthly Report (Excel)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
