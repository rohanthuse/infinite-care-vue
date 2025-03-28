
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Pill, FileText, MoreHorizontal, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface PatientMedicationDetailProps {
  patientId: string;
}

// Mock medication data
const mockMedications = [
  {
    id: "MED-001",
    name: "Lisinopril",
    dosage: "10mg",
    route: "oral",
    frequency: "Once daily",
    startDate: new Date(2023, 4, 10),
    endDate: new Date(2023, 11, 10),
    time: "08:00",
    prescribedBy: "Dr. James Wilson",
    status: "Active",
    notes: "Take on an empty stomach",
    lastAdministered: new Date(2023, 5, 10)
  },
  {
    id: "MED-002",
    name: "Metformin",
    dosage: "500mg",
    route: "oral",
    frequency: "Twice daily",
    startDate: new Date(2023, 3, 15),
    endDate: new Date(2023, 9, 15),
    time: "09:00, 18:00",
    prescribedBy: "Dr. Emma Thompson",
    status: "Active",
    notes: "Take with food",
    lastAdministered: new Date(2023, 5, 9)
  },
  {
    id: "MED-003",
    name: "Amlodipine",
    dosage: "5mg",
    route: "oral",
    frequency: "Once daily",
    startDate: new Date(2023, 2, 20),
    endDate: new Date(2023, 8, 20),
    time: "20:00",
    prescribedBy: "Dr. Michael Scott",
    status: "Active",
    notes: "May cause dizziness",
    lastAdministered: new Date(2023, 5, 10)
  },
  {
    id: "MED-004",
    name: "Atorvastatin",
    dosage: "20mg",
    route: "oral",
    frequency: "Once daily",
    startDate: new Date(2023, 1, 5),
    endDate: new Date(2023, 7, 5),
    time: "20:00",
    prescribedBy: "Dr. James Wilson",
    status: "Discontinued",
    notes: "Take at night",
    lastAdministered: new Date(2023, 4, 30)
  }
];

// Mock MAR chart data for the last 7 days
const generateMockMarData = () => {
  const today = new Date();
  const marData = [];
  
  for (let i = 0; i < mockMedications.length; i++) {
    const med = mockMedications[i];
    const medMarData = {
      id: med.id,
      name: med.name,
      dosage: med.dosage,
      days: []
    };
    
    for (let j = 6; j >= 0; j--) {
      const date = subDays(today, j);
      // Random status: 0 = not given, 1 = given, 2 = refused, 3 = not applicable
      let status;
      if (med.status === "Discontinued" && j < 3) {
        status = 3; // Not applicable for discontinued meds
      } else {
        const rand = Math.random();
        if (rand > 0.8) status = 2; // Refused (20% chance)
        else if (rand > 0.1) status = 1; // Given (70% chance)
        else status = 0; // Not given (10% chance)
      }
      
      medMarData.days.push({
        date,
        status,
        givenBy: status === 1 ? "Nurse S.J." : null,
        time: status === 1 ? "08:30" : null
      });
    }
    
    marData.push(medMarData);
  }
  
  return marData;
};

const mockMarData = generateMockMarData();

// Mock pending medications
const mockPendingMedications = [
  {
    id: "PEND-001",
    name: "Paracetamol",
    dosage: "500mg",
    dueTime: "14:30",
    dueDate: new Date(),
    patient: "Wendy Smith",
    status: "Due",
    priority: "Medium"
  },
  {
    id: "PEND-002",
    name: "Amoxicillin",
    dosage: "250mg",
    dueTime: "16:00",
    dueDate: new Date(),
    patient: "Wendy Smith",
    status: "Overdue",
    priority: "High"
  },
  {
    id: "PEND-003",
    name: "Ibuprofen",
    dosage: "400mg",
    dueTime: "20:00",
    dueDate: new Date(),
    patient: "Wendy Smith",
    status: "Scheduled",
    priority: "Low"
  }
];

const PatientMedicationDetail: React.FC<PatientMedicationDetailProps> = ({ patientId }) => {
  const [activeTab, setActiveTab] = useState("medications");
  
  const handleActionClick = (action: string, medicationId: string) => {
    toast.success(`${action} action for medication ${medicationId}`, {
      description: "This feature will be implemented soon",
    });
  };
  
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">{status}</Badge>;
      case "Discontinued":
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">{status}</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">{status}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200">{status}</Badge>;
    }
  };
  
  const renderMarStatus = (status: number) => {
    switch (status) {
      case 1: // Given
        return <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-600" /></div>;
      case 2: // Refused
        return <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center"><AlertCircle className="w-4 h-4 text-red-600" /></div>;
      case 3: // Not applicable
        return <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"><MoreHorizontal className="w-4 h-4 text-gray-600" /></div>;
      default: // Not given
        return <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-yellow-600" /></div>;
    }
  };

  const renderPendingStatusBadge = (status: string) => {
    switch (status) {
      case "Due":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">{status}</Badge>;
      case "Overdue":
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">{status}</Badge>;
      case "Scheduled":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200">{status}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200">{status}</Badge>;
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">{priority}</Badge>;
      case "Medium":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200">{priority}</Badge>;
      case "Low":
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">{priority}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200">{priority}</Badge>;
    }
  };
  
  return (
    <Tabs defaultValue="medications" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6 bg-white border border-gray-100 rounded-xl shadow-sm p-1">
        <TabsTrigger value="medications" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-800 rounded-lg px-4 py-2">
          Medications
        </TabsTrigger>
        <TabsTrigger value="mar" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-800 rounded-lg px-4 py-2">
          MAR Chart
        </TabsTrigger>
        <TabsTrigger value="records" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-800 rounded-lg px-4 py-2">
          Records
        </TabsTrigger>
        <TabsTrigger value="pending" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-800 rounded-lg px-4 py-2">
          Pending
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="medications" className="mt-0">
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Prescribed By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMedications.map((medication) => (
                <TableRow key={medication.id}>
                  <TableCell className="font-medium">{medication.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{medication.name}</div>
                    <div className="text-xs text-gray-500">Route: {medication.route}</div>
                  </TableCell>
                  <TableCell>{medication.dosage}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm">
                        <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                        <span>{medication.time}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>{format(medication.startDate, "MMM d, yyyy")} - {format(medication.endDate, "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{medication.prescribedBy}</TableCell>
                  <TableCell>{renderStatusBadge(medication.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleActionClick("View", medication.id)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActionClick("Edit", medication.id)}>
                          Edit Medication
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleActionClick("Record", medication.id)}>
                          Record Administration
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActionClick("History", medication.id)}>
                          View History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {medication.status === "Active" ? (
                          <DropdownMenuItem onClick={() => handleActionClick("Discontinue", medication.id)} className="text-red-600">
                            Discontinue
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleActionClick("Reactivate", medication.id)} className="text-green-600">
                            Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      
      <TabsContent value="mar" className="mt-0">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Medication Administration Record</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Print MAR Chart
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Medication</TableHead>
                    {mockMarData[0]?.days.map((day, idx) => (
                      <TableHead key={idx} className="text-center min-w-[100px]">
                        {format(day.date, "E")}
                        <div className="text-xs font-normal text-gray-500">
                          {format(day.date, "MMM d")}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMarData.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell>
                        <div className="font-medium">{med.name}</div>
                        <div className="text-xs text-gray-500">{med.dosage}</div>
                      </TableCell>
                      {med.days.map((day, idx) => (
                        <TableCell key={idx} className="text-center">
                          <div className="flex flex-col items-center justify-center">
                            {renderMarStatus(day.status)}
                            {day.status === 1 && (
                              <div className="mt-1 text-xs text-gray-500">
                                {day.time}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-6 flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm">Given</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-3 h-3 text-red-600" />
                </div>
                <span className="text-sm">Refused</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-yellow-600" />
                </div>
                <span className="text-sm">Not Given</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                  <MoreHorizontal className="w-3 h-3 text-gray-600" />
                </div>
                <span className="text-sm">Not Applicable</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="records" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medication Administration Records</CardTitle>
            <CardDescription>Historical records of medication administration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <Pill className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No Records Available</h3>
              <p className="text-gray-500 max-w-md mx-auto mt-2">
                There are no medication administration records available at this time. Records will appear here once medications have been administered.
              </p>
              <Button variant="outline" className="mt-4">
                Record Administration
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="pending" className="mt-0">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Medications</CardTitle>
            <CardDescription>Medications due for administration</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Time</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPendingMedications.map((medication) => (
                  <TableRow key={medication.id}>
                    <TableCell>
                      <div className="font-medium">{medication.dueTime}</div>
                      <div className="text-xs text-gray-500">{format(medication.dueDate, "MMM d")}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{medication.name}</div>
                    </TableCell>
                    <TableCell>{medication.dosage}</TableCell>
                    <TableCell>{renderPendingStatusBadge(medication.status)}</TableCell>
                    <TableCell>{renderPriorityBadge(medication.priority)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Administer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" size="sm">View All Pending</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default PatientMedicationDetail;
