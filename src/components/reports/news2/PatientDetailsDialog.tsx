
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Download, 
  FileDown, 
  FileSpreadsheet, 
  FileText, 
  HistoryIcon, 
  PlusCircle, 
  Printer, 
  Share2, 
  User 
} from "lucide-react";
import { News2Patient } from "./news2Types";
import { ObservationHistory } from "./ObservationHistory";
import { ObservationChart } from "./ObservationChart";
import { NewObservationDialog } from "./NewObservationDialog";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateNews2PDF } from "@/utils/pdfGenerator";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PatientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: News2Patient;
}

export function PatientDetailsDialog({
  open,
  onOpenChange,
  patient
}: PatientDetailsDialogProps) {
  const [isNewObservationOpen, setIsNewObservationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  
  const getStatusText = (score: number) => {
    if (score >= 7) return "High Risk";
    if (score >= 5) return "Medium Risk";
    return "Low Risk";
  };
  
  const getStatusColor = (score: number) => {
    if (score >= 7) return "text-red-600";
    if (score >= 5) return "text-amber-600";
    return "text-green-600";
  };

  const handleExport = (format: string) => {
    try {
      if (format === "PDF") {
        // Get the branch name from the URL or use a default
        const url = window.location.pathname;
        const branchNameMatch = url.match(/\/branch-dashboard\/\d+\/([^/]+)/);
        const branchName = branchNameMatch 
          ? decodeURIComponent(branchNameMatch[1]) 
          : "Med-Infinite Branch";
        
        generateNews2PDF(patient, branchName);
        toast.success("PDF exported successfully", {
          description: `NEWS2 report for ${patient.name} has been downloaded`
        });
      } else if (format === "CSV") {
        exportToCSV(patient);
        toast.success("CSV exported successfully", {
          description: `NEWS2 data for ${patient.name} has been downloaded`
        });
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

  const exportToCSV = (patient: News2Patient) => {
    // Build CSV headers and format data
    const headers = ["Date,Time,Patient ID,Patient Name,Resp Rate,SpO2,BP,Pulse,Temperature,Consciousness,O2 Therapy,Score"];
    
    const rows = patient.observations?.map(obs => {
      const date = new Date(obs.dateTime);
      return [
        format(date, "yyyy-MM-dd"),
        format(date, "HH:mm"),
        patient.id,
        patient.name,
        obs.respRate,
        obs.spo2,
        obs.systolicBP,
        obs.pulse,
        obs.temperature,
        obs.consciousness,
        obs.o2Therapy ? "Yes" : "No",
        obs.score
      ].join(',');
    }) || [];
    
    const csvContent = headers.concat(rows).join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NEWS2_${patient.name.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  const handleShare = () => {
    toast.info("Sharing options", {
      description: "Report sharing options would appear here"
    });
  };
  
  return <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Patient Details</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="space-y-6 px-1">
              <div className="flex flex-col md:flex-row justify-between pb-4 border-b gap-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-medium mr-4">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{patient.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 gap-3 mt-1">
                      <div className="flex items-center">
                        <User className="h-3.5 w-3.5 mr-1" />
                        {patient.age} years
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        ID: {patient.id}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Last updated: {format(new Date(patient.lastUpdated), "dd MMM yyyy, HH:mm")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className={`py-2 px-4 rounded-lg border font-medium ${getStatusColor(patient.latestScore)}`}>
                    <div className="text-sm">NEWS2 Score</div>
                    <div className="flex items-end">
                      <span className="text-2xl font-bold mr-2">{patient.latestScore}</span>
                      <span className="text-sm">({getStatusText(patient.latestScore)})</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-4">
                <Tabs defaultValue="history" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="sticky top-0 z-10 bg-background">
                    <TabsTrigger value="history">
                      <HistoryIcon className="h-4 w-4 mr-2" />
                      Observation History
                    </TabsTrigger>
                    <TabsTrigger value="chart">
                      <FileText className="h-4 w-4 mr-2" />
                      Score Chart
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="history" className="mt-4">
                    <ObservationHistory patient={patient} />
                  </TabsContent>
                  
                  <TabsContent value="chart" className="mt-4">
                    <ObservationChart patient={patient} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ScrollArea>
            
          <div className="flex justify-end gap-2 mt-4 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
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
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  <span>Print Report</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button onClick={() => setIsNewObservationOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Observation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <NewObservationDialog open={isNewObservationOpen} onOpenChange={setIsNewObservationOpen} patients={[patient]} defaultPatientId={patient.id} />
    </>;
}
