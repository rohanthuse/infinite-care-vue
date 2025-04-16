
import React, { useState } from "react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, ChevronRight } from "lucide-react";
import { News2Patient } from "./news2Types";
import { format } from "date-fns";
import { PatientDetailsDialog } from "./PatientDetailsDialog";

interface News2PatientListProps {
  patients: News2Patient[];
}

export function News2PatientList({ patients }: News2PatientListProps) {
  const [selectedPatient, setSelectedPatient] = useState<News2Patient | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const getStatusColor = (score: number) => {
    if (score >= 7) return "bg-red-100 text-red-700";
    if (score >= 5) return "bg-amber-100 text-amber-700";
    return "bg-green-100 text-green-700";
  };

  const handleViewDetails = (patient: News2Patient) => {
    setSelectedPatient(patient);
    setDetailsDialogOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Patient</TableHead>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead className="text-center">Latest Score</TableHead>
              <TableHead>Trend</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length > 0 ? (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-2">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div>{patient.name}</div>
                        <div className="text-gray-500 text-xs">{patient.age} years</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{patient.id}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <div className={`px-3 py-1 rounded-full ${getStatusColor(patient.latestScore)}`}>
                        {patient.latestScore}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {patient.trend === "up" ? (
                        <div className="text-red-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="m18 9-6-6-6 6"/>
                            <path d="M6 9v12"/>
                            <path d="M18 9v12"/>
                          </svg>
                          <span className="text-xs">Increasing</span>
                        </div>
                      ) : patient.trend === "down" ? (
                        <div className="text-green-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M6 15 12 9 18 15"/>
                          </svg>
                          <span className="text-xs">Decreasing</span>
                        </div>
                      ) : (
                        <div className="text-gray-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M8 12L16 12"/>
                          </svg>
                          <span className="text-xs">Stable</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(patient.lastUpdated), "dd MMM yyyy, HH:mm")}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewDetails(patient)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewDetails(patient)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-gray-500">No patients match your criteria</p>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedPatient && (
        <PatientDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          patient={selectedPatient}
        />
      )}
    </>
  );
}
