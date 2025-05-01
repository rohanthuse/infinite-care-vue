
import React, { useState, useEffect } from "react";
import { Search, Filter, UserRound, AlertTriangle, ArrowUp, ArrowDown, Activity, Clock, RefreshCw, Calendar, Download, FileText, FileSpreadsheet, Printer, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { NewObservationDialog } from "@/components/reports/news2/NewObservationDialog";
import { PatientDetailsDialog } from "@/components/reports/news2/PatientDetailsDialog";
import { getNews2Patients } from "@/components/reports/news2/news2Data";
import { News2Patient } from "@/components/reports/news2/news2Types";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { addDays, format, isWithinInterval, parseISO } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { generateNews2PDF } from "@/utils/pdfGenerator";

type SortField = "name" | "score" | "lastUpdated";
type SortDirection = "asc" | "desc";

const CarerNews2: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<News2Patient | null>(null);
  const [isNewObservationOpen, setIsNewObservationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<News2Patient[]>([]);
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  
  // Load patients data from the same source as the admin dashboard
  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = () => {
    setIsLoading(true);
    
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

  // Handle exporting data in different formats
  const handleExport = (format: string) => {
    try {
      if (format === "PDF") {
        if (selectedPatient) {
          generateNews2PDF(selectedPatient, "Med-Infinite Branch");
          toast.success("PDF exported successfully", {
            description: `NEWS2 report for ${selectedPatient.name} has been downloaded`
          });
        } else {
          toast.error("Please select a patient first", {
            description: "You must select a patient to export their report"
          });
        }
      } else if (format === "CSV") {
        if (selectedPatient) {
          exportToCSV(selectedPatient);
          toast.success("CSV exported successfully", {
            description: `NEWS2 data for ${selectedPatient.name} has been downloaded`
          });
        } else {
          toast.error("Please select a patient first", {
            description: "You must select a patient to export their data"
          });
        }
      } else if (format === "Print") {
        window.print();
        toast.success("Print dialog opened");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", {
        description: "There was a problem exporting the report"
      });
    }
  };

  // Export patient data to CSV
  const exportToCSV = (patient: News2Patient) => {
    // Build CSV headers and format data
    const headers = ["Date,Time,Patient ID,Patient Name,Score,Risk Level"];
    const rows = patient.observations?.map(obs => {
      const date = new Date(obs.dateTime);
      let riskLevel = "Low Risk";
      if (obs.score >= 7) riskLevel = "High Risk";
      else if (obs.score >= 5) riskLevel = "Medium Risk";
      
      return [
        format(date, "yyyy-MM-dd"), 
        format(date, "HH:mm"), 
        patient.id, 
        patient.name, 
        obs.score,
        riskLevel
      ].join(',');
    }) || [];
    
    const csvContent = headers.concat(rows).join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NEWS2_${patient.name.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Filter patients based on search query, urgency, and date range
  const filteredPatients = patients.filter(patient => {
    // Text search
    const searchMatches = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Urgency filter
    let urgencyMatches = true;
    if (urgencyFilter === "high") urgencyMatches = patient.latestScore >= 7;
    else if (urgencyFilter === "medium") urgencyMatches = patient.latestScore >= 5 && patient.latestScore < 7;
    else if (urgencyFilter === "low") urgencyMatches = patient.latestScore < 5;
    
    // Date range filter
    let dateMatches = true;
    if (dateRange?.from && dateRange?.to) {
      const patientDate = new Date(patient.lastUpdated);
      dateMatches = isWithinInterval(patientDate, {
        start: dateRange.from,
        end: addDays(dateRange.to, 1)
      });
    }
    
    return searchMatches && urgencyMatches && dateMatches;
  });

  // Sort filtered patients
  const sortedPatients = [...filteredPatients].sort((a, b) => {
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
  
  // Calculate counts for risk categories
  const patientsByRisk = {
    high: patients.filter(p => p.latestScore >= 7).length,
    medium: patients.filter(p => p.latestScore >= 5 && p.latestScore < 7).length,
    low: patients.filter(p => p.latestScore < 5).length
  };
  
  // Utility functions for UI display
  const getScoreColor = (score: number) => {
    if (score >= 7) return "bg-red-500";
    if (score >= 5) return "bg-orange-500";
    if (score >= 3) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <ArrowUp className="h-4 w-4 text-red-500" />;
    if (trend === "down") return <ArrowDown className="h-4 w-4 text-green-500" />;
    return <span className="h-4 w-4">–</span>;
  };
  
  const getVitalStatusColor = (status: string) => {
    if (status === "high") return "text-red-500";
    if (status === "medium") return "text-orange-500";
    return "text-green-500";
  };

  // Handle sorting change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Handle new observation for a specific patient
  const handleNewObservation = (patient?: News2Patient) => {
    if (patient) {
      setSelectedPatient(patient);
    }
    setIsNewObservationOpen(true);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">NEWS2 Monitoring</h1>
      
      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              className="pl-8"
              placeholder="Search patients by name or ID" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Calendar className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto" align="start">
              <div className="space-y-2">
                <h4 className="font-medium">Date Range</h4>
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                />
              </div>
            </PopoverContent>
          </Popover>
          
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              <SelectItem value="high">High Risk (7+)</SelectItem>
              <SelectItem value="medium">Medium Risk (5-6)</SelectItem>
              <SelectItem value="low">Low Risk (0-4)</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSort("score")}>
                Sort by Score {sortField === "score" && (sortDirection === "asc" ? "(Low to High)" : "(High to Low)")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("name")}>
                Sort by Name {sortField === "name" && (sortDirection === "asc" ? "(A to Z)" : "(Z to A)")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("lastUpdated")}>
                Sort by Last Updated {sortField === "lastUpdated" && (sortDirection === "asc" ? "(Oldest First)" : "(Newest First)")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setIsNewObservationOpen(true)}>
            <Activity className="h-4 w-4 mr-2" />
            Record Vitals
          </Button>
        </div>
      </div>
      
      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-l-4 border-l-red-500">
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
        
        <Card className="border-l-4 border-l-amber-500">
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
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Low Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">{patientsByRisk.low}</div>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">NEWS2 < 5</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Patient List */}
      <Tabs defaultValue={urgencyFilter === "all" ? "all" : urgencyFilter} value={urgencyFilter} onValueChange={setUrgencyFilter}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="all" className="flex-1">
            All Patients ({filteredPatients.length})
          </TabsTrigger>
          <TabsTrigger value="high" className="flex-1">
            High Risk ({patientsByRisk.high})
          </TabsTrigger>
          <TabsTrigger value="medium" className="flex-1">
            Medium Risk ({patientsByRisk.medium})
          </TabsTrigger>
          <TabsTrigger value="low" className="flex-1">
            Low Risk ({patientsByRisk.low})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="m-0 space-y-4">
          {renderPatientList(sortedPatients)}
        </TabsContent>
        <TabsContent value="high" className="m-0 space-y-4">
          {renderPatientList(sortedPatients)}
        </TabsContent>
        <TabsContent value="medium" className="m-0 space-y-4">
          {renderPatientList(sortedPatients)}
        </TabsContent>
        <TabsContent value="low" className="m-0 space-y-4">
          {renderPatientList(sortedPatients)}
        </TabsContent>
      </Tabs>
      
      {/* Dialog for adding new observations */}
      <NewObservationDialog
        open={isNewObservationOpen}
        onOpenChange={setIsNewObservationOpen}
        patients={patients}
        defaultPatientId={selectedPatient?.id}
      />
      
      {/* Dialog for patient details */}
      {selectedPatient && (
        <PatientDetailsDialog
          open={!!selectedPatient}
          onOpenChange={(open) => !open && setSelectedPatient(null)}
          patient={selectedPatient}
        />
      )}
    </div>
  );
  
  // Helper function to render patient list
  function renderPatientList(patients: News2Patient[]) {
    if (isLoading) {
      return (
        <div className="py-12 text-center bg-white border border-gray-200 rounded-lg">
          <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent animate-spin mx-auto mb-3"></div>
          <h3 className="text-lg font-medium text-gray-900">Loading patients...</h3>
        </div>
      );
    }
    
    if (patients.length === 0) {
      return (
        <div className="py-12 text-center bg-white border border-gray-200 rounded-lg">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <UserRound className="h-6 w-6 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No patients found</h3>
          <p className="text-gray-500 mt-2">
            {searchQuery ? "Try a different search term or filter" : "No patients match the current filters"}
          </p>
        </div>
      );
    }
    
    return patients.map((patient) => (
      <Card key={patient.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPatient(patient)}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                {patient.name.split(" ").map(name => name[0]).join("")}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{patient.name}</h3>
                  <span className="text-sm text-gray-500">({patient.age} yrs)</span>
                </div>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Last updated: {format(new Date(patient.lastUpdated), "dd MMM, HH:mm")}</span>
                  </div>
                  <div className="flex items-center">
                    <div>ID: {patient.id}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-500 mb-1">NEWS2 Score</div>
                <div className={`w-8 h-8 rounded-full ${getScoreColor(patient.latestScore)} text-white flex items-center justify-center font-bold`}>
                  {patient.latestScore}
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-500 mb-1">Trend</div>
                <div className="w-8 h-8 flex items-center justify-center">
                  {getTrendIcon(patient.trend)}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport("PDF");
                  }}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNewObservation(patient);
                  }}
                >
                  <Activity className="h-4 w-4 mr-1" />
                  Record
                </Button>
              </div>
            </div>
          </div>
          
          {patient.latestScore >= 7 && (
            <div className="mt-3 flex items-center">
              <Badge variant="destructive" className="flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                High Risk - Urgent clinical response required
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    ));
  }
};

export default CarerNews2;
