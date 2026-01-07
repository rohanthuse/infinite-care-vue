import React, { useState } from "react";
import { FileBarChart, Calendar, Download, ChevronRight, Filter, FileText, BarChart, PieChart, LineChart, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays } from "date-fns";
import { ReportsHeader } from "@/components/reports/ReportsHeader";
import { News2Dashboard } from "@/components/reports/news2/News2Dashboard";
import { generateNews2PDF, generateNews2SummaryPDF } from "@/utils/pdfGenerator";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ReportExporter } from "@/utils/reportExporter";
import { useCarerProfile } from "@/hooks/useCarerProfile";
import { CarerAttendanceReports } from "@/components/reports/attendance/CarerAttendanceReports";
import { CarerActivityReports } from "@/components/reports/activity/CarerActivityReports";
import { CarerScheduleReport } from "@/components/reports/schedule/CarerScheduleReport";

type ReportType = 
  | "clinical"
  | "activity" 
  | "attendance"
  | "schedule";

interface ReportOption {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const CarerReports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>("clinical");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  const { data: carerProfile, isLoading: authLoading } = useCarerProfile();

  // Debug logging
  console.log('[CarerReports] Auth loading:', authLoading);
  console.log('[CarerReports] Carer profile:', carerProfile);
  console.log('[CarerReports] Branch ID:', carerProfile?.branch_id);
  
  const reportOptions: ReportOption[] = [
    {
      id: "clinical",
      title: "Clinical Reports",
      description: "Monitor patient observations and NEWS2 scores",
      icon: <LineChart className="h-6 w-6" />
    },
    {
      id: "activity",
      title: "Activity Reports",
      description: "View care activities and client interactions",
      icon: <BarChart className="h-6 w-6" />
    },
    {
      id: "attendance",
      title: "Attendance Reports",
      description: "Track working hours and attendance",
      icon: <PieChart className="h-6 w-6" />
    },
    {
      id: "schedule",
      title: "Schedule Report",
      description: "Generate your upcoming booking plan",
      icon: <CalendarDays className="h-6 w-6" />
    }
  ];

  // Handle exporting data
  const handleExport = (exportFormat: string, patientId?: string) => {
    try {
      if (exportFormat === "PDF") {
        if (activeReport === "clinical") {
          // For clinical data, generate a summary report
          const safeRange = dateRange && dateRange.from && dateRange.to 
            ? { from: dateRange.from, to: dateRange.to } 
            : null;
              
          // Note: We would need actual patient data here for real export
          toast.success("Clinical report export would generate here", {
            description: "NEWS2 clinical data export functionality"
          });
        } else {
          // Use new report exporter for other report types
          const mockData = [
            { type: activeReport, name: "Sample Data", value: 100, date: format(new Date(), 'yyyy-MM-dd') }
          ];

          const exportDateRange = dateRange?.from && dateRange?.to 
            ? { from: dateRange.from, to: dateRange.to }
            : null;
          
          ReportExporter.exportToPDF({
            title: `${reportOptions.find(r => r.id === activeReport)?.title} Report`,
            data: mockData,
            columns: ['type', 'name', 'value', 'date'],
            branchName: carerProfile?.branch_id || 'Med-Infinite Branch',
            dateRange: exportDateRange
          });
          
          toast.success(`${exportFormat} export initiated`, {
            description: "Your report will download shortly"
          });
        }
      } else if (exportFormat === "CSV") {
        const mockData = [
          { type: activeReport, name: "Sample Data", value: 100, date: format(new Date(), 'yyyy-MM-dd') }
        ];
        
        ReportExporter.exportToCSV({
          title: `${reportOptions.find(r => r.id === activeReport)?.title} Report`,
          data: mockData,
          columns: ['type', 'name', 'value', 'date']
        });
        
        toast.success(`${exportFormat} export initiated`, {
          description: "Your data will download as a CSV file"
        });
      } else if (exportFormat === "Excel") {
        const mockData = [
          { type: activeReport, name: "Sample Data", value: 100, date: format(new Date(), 'yyyy-MM-dd') }
        ];
        
        ReportExporter.exportToExcel({
          title: `${reportOptions.find(r => r.id === activeReport)?.title} Report`,
          data: mockData,
          columns: ['type', 'name', 'value', 'date']
        });
        
        toast.success(`${exportFormat} export initiated`, {
          description: "Your data will download as an Excel file"
        });
      } else if (exportFormat === "Print") {
        const contentId = activeReport === "clinical" ? "news2-dashboard" : `${activeReport}-reports-content`;
        ReportExporter.printReport(contentId);
        toast.success("Print dialog opened");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", {
        description: "There was a problem exporting the report"
      });
    }
  };

  // Show loading state while carer profile is being loaded
  if (authLoading) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Show error state if no carer profile is available
  if (!carerProfile) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        <h1 className="text-xl md:text-2xl font-bold">Reports</h1>
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">Unable to load carer profile</p>
          <p className="text-sm text-gray-500">Please try refreshing the page or contact support</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Show error state if no branch ID is available
  if (!carerProfile.branch_id) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        <h1 className="text-xl md:text-2xl font-bold">Reports</h1>
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">Unable to load reports</p>
          <p className="text-sm text-gray-500">No valid branch information found for your account</p>
          <p className="text-xs text-gray-400 mt-2">Profile ID: {carerProfile.id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Reports</h1>

      <Card className="border border-gray-200 shadow-sm mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Reports Dashboard</CardTitle>
          <CardDescription>
            Generate and analyze reports across various categories
          </CardDescription>
        </CardHeader>
      </Card>

      <ReportsHeader />
      
      <div className="space-y-4 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {reportOptions.map((option) => (
            <Card 
              key={option.id}
              onClick={() => setActiveReport(option.id)}
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeReport === option.id 
                  ? "bg-blue-50 border-blue-200" 
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`p-2 rounded-full mb-2 ${
                  activeReport === option.id 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {option.icon}
                </div>
                <h3 className={`font-medium text-sm ${
                  activeReport === option.id ? "text-blue-700" : ""
                }`}>
                  {option.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
          
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{reportOptions.find(option => option.id === activeReport)?.title}</h2>
          
          {activeReport === "clinical" ? (
            <div id="news2-dashboard">
              <h3 className="text-lg font-medium mb-4">NEWS2 Clinical Dashboard</h3>
              <News2Dashboard 
                branchId={carerProfile.branch_id} 
                branchName="Med-Infinite Branch" 
              />
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => handleExport("PDF")}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Export Summary Report
                </Button>
              </div>
            </div>
          ) : activeReport === "activity" ? (
            <div id="activity-reports-content">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Calendar className="h-4 w-4 mr-2" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Select date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                    />
                  </PopoverContent>
                </Popover>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter Reports</span>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span>Generate Report</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExport("PDF")}>
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Generate PDF Report</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("CSV")}>
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Generate CSV Report</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("Excel")}>
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Generate Excel Report</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleExport("Print")}>
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Print Current View</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CarerActivityReports 
                dateRange={dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined}
              />
            </div>
          ) : activeReport === "attendance" ? (
            <div id="attendance-reports-content">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Calendar className="h-4 w-4 mr-2" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Select date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                    />
                  </PopoverContent>
                </Popover>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter Reports</span>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span>Generate Report</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExport("PDF")}>
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Generate PDF Report</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("CSV")}>
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Generate CSV Report</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("Excel")}>
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Generate Excel Report</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleExport("Print")}>
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Print Current View</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CarerAttendanceReports 
                dateRange={dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined}
              />
            </div>
          ) : activeReport === "schedule" ? (
            <div id="schedule-reports-content">
              <CarerScheduleReport branchName="Med-Infinite Branch" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CarerReports;
