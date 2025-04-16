
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowDown,
  ArrowUp,
  ArrowUpDown, 
  Bell, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  Printer, 
  PlusCircle, 
  RefreshCw, 
  Search, 
  Share2, 
  SlidersHorizontal 
} from "lucide-react";
import { News2PatientList } from "./News2PatientList";
import { NewObservationDialog } from "./NewObservationDialog";
import { AlertManagementDialog } from "./AlertManagementDialog";
import { getNews2Patients } from "./news2Data";
import { News2Patient } from "./news2Types";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { generateNews2SummaryPDF } from "@/utils/pdfGenerator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { addDays, format } from "date-fns";

interface News2DashboardProps {
  branchId: string;
  branchName: string;
}

type SortField = "name" | "score" | "lastUpdated";
type SortDirection = "asc" | "desc";

export function News2Dashboard({ branchId, branchName }: News2DashboardProps) {
  const [isNewObservationDialogOpen, setIsNewObservationDialogOpen] = useState(false);
  const [isAlertManagementOpen, setIsAlertManagementOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<"all" | "high" | "medium" | "low">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  // Get mock data
  const [patients, setPatients] = useState<News2Patient[]>([]);
  
  // Load data initially and provide a refresh function
  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = () => {
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const data = getNews2Patients();
      setPatients(data);
      setIsLoading(false);
    }, 600);
  };

  const handleRefresh = () => {
    toast.info("Refreshing data...");
    loadPatientData();
  };

  const handleExport = (format: string) => {
    try {
      if (format === "PDF") {
        generateNews2SummaryPDF(
          filteredPatients, 
          branchName, 
          activeView, 
          dateRange?.from && dateRange?.to ? dateRange : undefined
        );
        toast.success("PDF export started", {
          description: "NEWS2 summary report has been downloaded"
        });
      } else if (format === "CSV") {
        exportToCSV(filteredPatients);
        toast.success("CSV export started", {
          description: "NEWS2 data has been exported to CSV"
        });
      } else if (format === "Print") {
        window.print();
        toast.success("Print dialog opened");
      } else {
        toast.info(`${format} export not implemented yet`);
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", { 
        description: "There was a problem exporting the report" 
      });
    }
  };

  const exportToCSV = (patients: News2Patient[]) => {
    // Build CSV headers and format data
    const headers = ["Patient ID,Patient Name,Age,Latest Score,Risk Level,Trend,Last Updated"];
    
    const rows = patients.map(patient => {
      let riskLevel = "Low Risk";
      if (patient.latestScore >= 7) riskLevel = "High Risk";
      else if (patient.latestScore >= 5) riskLevel = "Medium Risk";
      
      let trend = "Stable";
      if (patient.trend === "up") trend = "Increasing";
      else if (patient.trend === "down") trend = "Decreasing";
      
      return [
        patient.id,
        patient.name,
        patient.age,
        patient.latestScore,
        riskLevel,
        trend,
        format(new Date(patient.lastUpdated), "yyyy-MM-dd HH:mm")
      ].join(',');
    });
    
    const csvContent = headers.concat(rows).join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NEWS2_Summary_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    toast.success("Sharing options", {
      description: "Report sharing options dialog would open here"
    });
  };

  const handleSort = (field: SortField) => {
    // If clicking the same field, toggle direction
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    
    toast.info(`Sorted by ${field} (${sortDirection === "asc" ? "ascending" : "descending"})`);
  };

  const getSortedAndFilteredPatients = () => {
    // Filter by active view
    let result = patients.filter((patient) => {
      if (activeView === "high" && patient.latestScore < 7) return false;
      if (activeView === "medium" && (patient.latestScore < 5 || patient.latestScore >= 7)) return false;
      if (activeView === "low" && patient.latestScore >= 5) return false;
      
      // Filter by search query
      if (searchQuery && !patient.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !patient.id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Apply date filter if available
      if (dateRange?.from && dateRange?.to) {
        const patientDate = new Date(patient.lastUpdated);
        if (patientDate < dateRange.from || patientDate > addDays(dateRange.to, 1)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort patients
    result = [...result].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "score") {
        comparison = a.latestScore - b.latestScore;
      } else if (sortField === "lastUpdated") {
        comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    return result;
  };

  const filteredPatients = getSortedAndFilteredPatients();

  const patientsByRisk = {
    high: patients.filter(p => p.latestScore >= 7).length,
    medium: patients.filter(p => p.latestScore >= 5 && p.latestScore < 7).length,
    low: patients.filter(p => p.latestScore < 5).length
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search patients by name or ID..." 
              className="pl-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto" align="start">
              <div className="space-y-2">
                <h4 className="font-medium">Date Range</h4>
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                />
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10"
            onClick={() => toast.info("Advanced filter options would appear here")}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="text-blue-600" onClick={() => setIsAlertManagementOpen(true)}>
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </Button>
          <Button onClick={() => setIsNewObservationDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Observation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`border-l-4 border-l-red-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">{patientsByRisk.high}</div>
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">NEWS2 ≥ 7</div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 border-l-amber-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Medium Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">{patientsByRisk.medium}</div>
              <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">NEWS2 5-6</div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 border-l-green-500`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Low Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">{patientsByRisk.low}</div>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">NEWS2 &lt; 5</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" value={activeView} onValueChange={(value) => setActiveView(value as "all" | "high" | "medium" | "low")}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all">All Patients</TabsTrigger>
            <TabsTrigger value="high">High Risk</TabsTrigger>
            <TabsTrigger value="medium">Medium Risk</TabsTrigger>
            <TabsTrigger value="low">Low Risk</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSort("name")}>
                  <div className="flex items-center w-full justify-between">
                    <span>Patient Name</span>
                    {sortField === "name" && (sortDirection === "asc" ? 
                      <ArrowUp className="h-4 w-4" /> : 
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("score")}>
                  <div className="flex items-center w-full justify-between">
                    <span>NEWS2 Score</span>
                    {sortField === "score" && (sortDirection === "asc" ? 
                      <ArrowUp className="h-4 w-4" /> : 
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("lastUpdated")}>
                  <div className="flex items-center w-full justify-between">
                    <span>Last Updated</span>
                    {sortField === "lastUpdated" && (sortDirection === "asc" ? 
                      <ArrowUp className="h-4 w-4" /> : 
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("PDF")}>
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Export as PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("CSV")}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <span>Export as CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("Print")}>
                  <Printer className="h-4 w-4 mr-2" />
                  <span>Print Report</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="m-0">
          <News2PatientList patients={filteredPatients} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="high" className="m-0">
          <News2PatientList patients={filteredPatients} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="medium" className="m-0">
          <News2PatientList patients={filteredPatients} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="low" className="m-0">
          <News2PatientList patients={filteredPatients} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      <NewObservationDialog 
        open={isNewObservationDialogOpen} 
        onOpenChange={setIsNewObservationDialogOpen} 
        patients={patients}
      />
      
      <AlertManagementDialog 
        open={isAlertManagementOpen} 
        onOpenChange={setIsAlertManagementOpen}
      />
    </div>
  );
}
