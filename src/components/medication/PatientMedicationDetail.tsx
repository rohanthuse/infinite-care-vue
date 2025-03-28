
import React, { useState } from "react";
import { 
  Pill, Clock, Calendar, Edit, Eye, Trash, AlertCircle, 
  Check, X, FileText, PlusCircle, ClipboardList, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "sonner";

interface PatientMedicationDetailProps {
  patientId: string;
}

// Mock data for medications
const mockMedications = [
  {
    id: "MED-001",
    name: "Paracetamol",
    dosage: "500mg",
    frequency: "4 times a day",
    startDate: "2023-05-10",
    endDate: "2023-06-10",
    patient: "Wendy Smith",
    patientId: "CL-3421",
    prescribedBy: "Dr. James Wilson",
    status: "Active",
    notes: "Take with food. Avoid alcohol.",
    route: "Oral",
    lastAdministered: "2023-05-18T09:30:00",
    nextDue: "2023-05-18T13:30:00",
  },
  {
    id: "MED-002",
    name: "Ibuprofen",
    dosage: "400mg",
    frequency: "3 times a day",
    startDate: "2023-05-15",
    endDate: "2023-05-25",
    patient: "Wendy Smith",
    patientId: "CL-3421",
    prescribedBy: "Dr. James Wilson",
    status: "Active",
    notes: "Take after meals.",
    route: "Oral",
    lastAdministered: "2023-05-18T08:00:00",
    nextDue: "2023-05-18T16:00:00",
  },
  {
    id: "MED-003",
    name: "Vitamin D",
    dosage: "1000 IU",
    frequency: "Once daily",
    startDate: "2023-04-20",
    endDate: "2023-10-20",
    patient: "Wendy Smith",
    patientId: "CL-3421",
    prescribedBy: "Dr. Emma Thompson",
    status: "Active",
    notes: "Take with breakfast.",
    route: "Oral",
    lastAdministered: "2023-05-18T08:30:00",
    nextDue: "2023-05-19T08:30:00",
  },
  {
    id: "MED-004",
    name: "Amoxicillin",
    dosage: "250mg",
    frequency: "3 times a day",
    startDate: "2023-05-15",
    endDate: "2023-05-22",
    patient: "John Michael",
    patientId: "CL-2356",
    prescribedBy: "Dr. Emma Thompson",
    status: "Active",
    notes: "Complete full course.",
    route: "Oral",
    lastAdministered: "2023-05-18T10:15:00",
    nextDue: "2023-05-18T14:15:00",
  },
  {
    id: "MED-005",
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily",
    startDate: "2023-03-15",
    endDate: "2023-09-15",
    patient: "Lisa Rodrigues",
    patientId: "CL-9876",
    prescribedBy: "Dr. Michael Scott",
    status: "Active",
    notes: "Monitor blood pressure.",
    route: "Oral",
    lastAdministered: "2023-05-18T09:00:00",
    nextDue: "2023-05-19T09:00:00",
  }
];

// MAR (Medication Administration Record) data
const mockMarRecords = [
  {
    id: "MAR-001",
    medicationId: "MED-001",
    medicationName: "Paracetamol",
    dosage: "500mg",
    patientId: "CL-3421",
    adminTime: "2023-05-18T09:30:00",
    scheduledTime: "2023-05-18T09:00:00",
    adminBy: "Nurse Sarah Johnson",
    status: "Administered",
    notes: "Patient reported mild pain relief after 30 minutes."
  },
  {
    id: "MAR-002",
    medicationId: "MED-002",
    medicationName: "Ibuprofen",
    dosage: "400mg",
    patientId: "CL-3421",
    adminTime: "2023-05-18T08:00:00",
    scheduledTime: "2023-05-18T08:00:00",
    adminBy: "Nurse David Wilson",
    status: "Administered",
    notes: ""
  },
  {
    id: "MAR-003",
    medicationId: "MED-003",
    medicationName: "Vitamin D",
    dosage: "1000 IU",
    patientId: "CL-3421",
    adminTime: "2023-05-18T08:30:00",
    scheduledTime: "2023-05-18T08:30:00",
    adminBy: "Nurse Sarah Johnson",
    status: "Administered",
    notes: ""
  },
  {
    id: "MAR-004",
    medicationId: "MED-001",
    medicationName: "Paracetamol",
    dosage: "500mg",
    patientId: "CL-3421",
    adminTime: "2023-05-17T21:30:00",
    scheduledTime: "2023-05-17T21:00:00",
    adminBy: "Nurse David Wilson",
    status: "Administered",
    notes: "Patient was sleeping. Administered when awoke."
  },
  {
    id: "MAR-005",
    medicationId: "MED-002",
    medicationName: "Ibuprofen",
    dosage: "400mg",
    patientId: "CL-3421",
    adminTime: "2023-05-17T16:00:00",
    scheduledTime: "2023-05-17T16:00:00",
    adminBy: "Nurse Sarah Johnson",
    status: "Administered",
    notes: ""
  }
];

// Mock pending medications
const mockPendingMedications = [
  {
    id: "PEN-001",
    medicationId: "MED-001",
    medicationName: "Paracetamol",
    dosage: "500mg",
    patientId: "CL-3421",
    scheduledTime: "2023-05-18T13:30:00",
    status: "Due",
    notes: ""
  },
  {
    id: "PEN-002",
    medicationId: "MED-002",
    medicationName: "Ibuprofen",
    dosage: "400mg",
    patientId: "CL-3421",
    scheduledTime: "2023-05-18T16:00:00",
    status: "Upcoming",
    notes: ""
  },
  {
    id: "PEN-003",
    medicationId: "MED-003",
    medicationName: "Vitamin D",
    dosage: "1000 IU",
    patientId: "CL-3421",
    scheduledTime: "2023-05-19T08:30:00",
    status: "Upcoming",
    notes: ""
  }
];

const PatientMedicationDetail: React.FC<PatientMedicationDetailProps> = ({ patientId }) => {
  const [activeTab, setActiveTab] = useState("medications");
  
  // Filter medications for this patient
  const patientMedications = mockMedications.filter(med => med.patientId === patientId);
  
  // Filter MAR records for this patient
  const patientMarRecords = mockMarRecords.filter(mar => mar.patientId === patientId);
  
  // Filter pending medications for this patient
  const patientPendingMedications = mockPendingMedications.filter(pending => pending.patientId === patientId);
  
  const handleViewMedication = (id: string) => {
    toast.info(`Viewing medication ${id}`, {
      description: "This feature is coming soon",
    });
  };
  
  const handleEditMedication = (id: string) => {
    toast.info(`Editing medication ${id}`, {
      description: "This feature is coming soon",
    });
  };
  
  const handleDeleteMedication = (id: string) => {
    toast.warning(`Delete medication ${id}?`, {
      description: "This feature is coming soon",
      action: {
        label: "Confirm",
        onClick: () => {
          toast.success(`Medication ${id} deleted`);
        },
      },
    });
  };
  
  const handleRecordAdministration = (id: string) => {
    toast.info(`Record administration for ${id}`, {
      description: "This feature is coming soon",
    });
  };
  
  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 lg:w-[400px] mb-4">
          <TabsTrigger value="medications" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            <span>Medications</span>
          </TabsTrigger>
          <TabsTrigger value="mar" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>MAR Chart</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="medications" className="space-y-4">
          {patientMedications.length > 0 ? (
            <div className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead className="hidden md:table-cell">Dosage</TableHead>
                    <TableHead className="hidden lg:table-cell">Frequency</TableHead>
                    <TableHead className="hidden md:table-cell">Start Date</TableHead>
                    <TableHead className="hidden lg:table-cell">End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientMedications.map((medication) => (
                    <TableRow key={medication.id}>
                      <TableCell className="font-medium">{medication.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{medication.name}</div>
                        <div className="text-xs text-gray-500">Prescribed by: {medication.prescribedBy}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {medication.dosage}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {medication.frequency}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(medication.startDate), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {format(new Date(medication.endDate), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            medication.status === "Active" ? "text-green-600 bg-green-50 border-green-200" :
                            medication.status === "Completed" ? "text-blue-600 bg-blue-50 border-blue-200" :
                            "text-amber-600 bg-amber-50 border-amber-200"
                          }
                        >
                          {medication.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleViewMedication(medication.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEditMedication(medication.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleDeleteMedication(medication.id)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Pill className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No medications found</h3>
              <p className="text-gray-500 mb-4">This patient does not have any medications recorded.</p>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </div>
          )}
          
          {patientMedications.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-semibold mb-3">Medication Notes</h3>
              <div className="space-y-3">
                {patientMedications.map((medication) => (
                  <Card key={`notes-${medication.id}`}>
                    <CardHeader className="p-3 pb-0">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium">{medication.name} ({medication.dosage})</CardTitle>
                        <Badge 
                          variant="outline" 
                          className="text-green-600 bg-green-50 border-green-200"
                        >
                          {medication.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        Route: {medication.route} | Frequency: {medication.frequency}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      <p className="text-sm text-gray-600">{medication.notes || "No specific notes."}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="mar" className="space-y-4">
          {patientMarRecords.length > 0 ? (
            <div className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Record ID</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead className="hidden md:table-cell">Scheduled</TableHead>
                    <TableHead>Administered</TableHead>
                    <TableHead className="hidden lg:table-cell">Admin By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientMarRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{record.medicationName}</div>
                        <div className="text-xs text-gray-500">{record.dosage}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(record.scheduledTime), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.adminTime), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {record.adminBy}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className="text-green-600 bg-green-50 border-green-200"
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="max-w-xs truncate text-sm">
                          {record.notes || "No notes"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <ClipboardList className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No MAR records found</h3>
              <p className="text-gray-500 mb-4">This patient does not have any medication administration records.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          {patientPendingMedications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {patientPendingMedications.map((pending) => (
                <Card key={pending.id} className={
                  pending.status === "Due" ? "border-amber-300 shadow-amber-100/50" : "border-gray-200"
                }>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-medium">{pending.medicationName}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={
                          pending.status === "Due" ? "text-amber-600 bg-amber-50 border-amber-200" :
                          "text-blue-600 bg-blue-50 border-blue-200"
                        }
                      >
                        {pending.status}
                      </Badge>
                    </div>
                    <CardDescription>{pending.dosage}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center text-sm mb-2">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Scheduled: {format(new Date(pending.scheduledTime), "dd MMM yyyy HH:mm")}</span>
                    </div>
                    {pending.notes && (
                      <div className="text-sm text-gray-600">
                        <p>Notes: {pending.notes}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      variant={pending.status === "Due" ? "default" : "outline"}
                      onClick={() => handleRecordAdministration(pending.id)}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Record Administration
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending medications</h3>
              <p className="text-gray-500 mb-4">This patient does not have any pending medication administrations.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientMedicationDetail;
