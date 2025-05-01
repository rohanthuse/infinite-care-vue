
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { News2Patient } from "./news2Types";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Printer } from "lucide-react";
import { generateNews2PDF } from "@/utils/pdfGenerator";
import { toast } from "sonner";

interface PatientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: News2Patient;
}

export const PatientDetailsDialog: React.FC<PatientDetailsDialogProps> = ({
  open,
  onOpenChange,
  patient,
}) => {
  const handleExport = () => {
    try {
      generateNews2PDF(patient, "Med-Infinite Branch");
      toast.success("PDF exported successfully", {
        description: `NEWS2 report for ${patient.name} has been downloaded`
      });
    } catch (error) {
      toast.error("Export failed", {
        description: "There was a problem exporting the report"
      });
    }
  };
  
  // Function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 7) return "bg-red-500 text-white";
    if (score >= 5) return "bg-orange-500 text-white";
    if (score >= 3) return "bg-yellow-500 text-white";
    return "bg-green-500 text-white";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Patient NEWS2 Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Patient Info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b">
            <div>
              <h2 className="text-xl font-semibold">{patient.name}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-1 text-gray-500">
                <div>ID: {patient.id}</div>
                <div>Age: {patient.age} years</div>
                <div>Last updated: {format(new Date(patient.lastUpdated), "dd MMM yyyy, HH:mm")}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-500 mb-1">Latest Score</div>
                <div className={`w-10 h-10 rounded-full ${getScoreColor(patient.latestScore)} flex items-center justify-center font-bold text-lg`}>
                  {patient.latestScore}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <FileText className="h-4 w-4 mr-1" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
              </div>
            </div>
          </div>
          
          {/* Clinical Action Based on Score */}
          <Card className={`border-l-4 ${
            patient.latestScore >= 7 
              ? "border-l-red-500 bg-red-50" 
              : patient.latestScore >= 5 
                ? "border-l-amber-500 bg-amber-50" 
                : "border-l-green-500 bg-green-50"
          }`}>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">
                {patient.latestScore >= 7 
                  ? "Urgent Clinical Response Required" 
                  : patient.latestScore >= 5 
                    ? "Urgent Ward-Based Response Required" 
                    : "Routine Monitoring"}
              </h3>
              <p className="text-sm">
                {patient.latestScore >= 7 
                  ? "Continuous monitoring, urgent assessment by a clinician with critical care competencies." 
                  : patient.latestScore >= 5 
                    ? "Urgent assessment by a clinician, increased frequency of monitoring." 
                    : "Continue routine monitoring as per care plan."}
              </p>
            </CardContent>
          </Card>
          
          {/* Observation History Table */}
          {patient.observations && patient.observations.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium mb-3">Observation History</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Resp Rate</TableHead>
                      <TableHead>SpO₂</TableHead>
                      <TableHead>O₂ Therapy</TableHead>
                      <TableHead>BP</TableHead>
                      <TableHead>Pulse</TableHead>
                      <TableHead>Consciousness</TableHead>
                      <TableHead>Temp</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.observations.map((obs) => (
                      <TableRow key={obs.id}>
                        <TableCell>{format(new Date(obs.dateTime), "dd MMM, HH:mm")}</TableCell>
                        <TableCell>{obs.respRate}</TableCell>
                        <TableCell>{obs.spo2}%</TableCell>
                        <TableCell>{obs.o2Therapy ? "Yes" : "No"}</TableCell>
                        <TableCell>{obs.systolicBP} mmHg</TableCell>
                        <TableCell>{obs.pulse}</TableCell>
                        <TableCell>{obs.consciousness}</TableCell>
                        <TableCell>{obs.temperature}°C</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(obs.score)}`}>
                            {obs.score}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-md">
              <p className="text-gray-500">No observation history available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
