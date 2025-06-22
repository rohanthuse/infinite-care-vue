
import React, { useState } from "react";
import { FileBarChart, Calendar, Download, ChevronRight, Filter, FileText, BarChart, PieChart, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays } from "date-fns";
import { ReportsHeader } from "@/components/reports/ReportsHeader";
import { News2Dashboard } from "@/components/reports/news2/News2Dashboard";
import { generateNews2PDF, generateNews2SummaryPDF } from "@/utils/pdfGenerator";
import { getNews2Patients } from "@/components/reports/news2/news2Data";
import { News2Patient } from "@/components/reports/news2/news2Types";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ReportExporter } from "@/utils/reportExporter";
import { useCarerAuth } from "@/hooks/useCarerAuth";

type ReportType = 
  | "clinical"
  | "activity" 
  | "attendance";

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
  const [patients, setPatients] = useState<News2Patient[]>([]);
  
  const { carerProfile } = useCarerAuth();
  
  // Load NEWS2 patients data when component mounts
  React.useEffect(() => {
    const data = getNews2Patients();
    setPatients(data);
  }, []);
  
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
    }
  ];

  // Handle exporting data
  const handleExport = (format: string, patientId?: string) => {
    try {
      if (format === "PDF") {
        if (activeReport === "clinical") {
          // For clinical data, use the NEWS2 PDF export
          if (patientId) {
            // Export single patient
            const patient = patients.find(p => p.id === patientId);
            if (patient) {
              generateNews2PDF(patient, "Med-Infinite Branch");
              toast.success("PDF exported successfully", {
                description: `NEWS2 report for ${patient.name} has been downloaded`
              });
            }
          } else {
            // Export summary of all patients
            const safeRange = dateRange && dateRange.from && dateRange.to 
              ? { from: dateRange.from, to: dateRange.to } 
              : undefined;
              
            generateNews2SummaryPDF(
              patients, 
              "Med-Infinite Branch",
              undefined,
              safeRange
            );
            toast.success("Summary PDF exported successfully", {
              description: "NEWS2 summary report has been downloaded"
            });
          }
        } else {
          // Use new report exporter for other report types
          const mockData = [
            { type: activeReport, name: "Sample Data", value: 100, date: format(new Date(), 'yyyy-MM-dd') }
          ];
          
          ReportExporter.exportToPDF({
            title: `${reportOptions.find(r => r.id === activeReport)?.title} Report`,
            data: mockData,
            columns: ['type', 'name', 'value', 'date'],
            branchName: carerProfile?.branch_id || 'Med-Infinite Branch',
            dateRange
          });
          
          toast.success(`${format} export initiated`, {
            description: "Your report will download shortly"
          });
        }
      } else if (format === "CSV") {
        const mockData = [
          { type: activeReport, name: "Sample Data", value: 100, date: format(new Date(), 'yyyy-MM-dd') }
        ];
        
        ReportExporter.exportToCSV({
          title: `${reportOptions.find(r => r.id === activeReport)?.title} Report`,
          data: mockData,
          columns: ['type', 'name', 'value', 'date']
        });
        
        toast.success(`${format} export initiated`, {
          description: "Your data will download as a CSV file"
        });
      } else if (format === "Excel") {
        const mockData = [
          { type: activeReport, name: "Sample Data", value: 100, date: format(new Date(), 'yyyy-MM-dd') }
        ];
        
        ReportExporter.exportToExcel({
          title: `${reportOptions.find(r => r.id === activeReport)?.title} Report`,
          data: mockData,
          columns: ['type', 'name', 'value', 'date']
        });
        
        toast.success(`${format} export initiated`, {
          description: "Your data will download as an Excel file"
        });
      } else if (format === "Print") {
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    ? "bg-blue-100 text-blue-700" 
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
                branchId={carerProfile?.branch_id || "carer-branch"} 
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
          ) : (
            <div id={`${activeReport}-reports-content`}>
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

              <div className="py-12 text-center bg-white border border-gray-200 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <FileBarChart className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Report Coming Soon</h3>
                <p className="text-gray-500 mt-2">
                  {activeReport === "activity" ? 
                    "Activity reports will show your care activities and client interactions." :
                    "Attendance reports will show your working hours and attendance patterns."
                  }
                </p>
                <p className="text-gray-500 text-sm mt-1">Export functionality is available above.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarerReports;
