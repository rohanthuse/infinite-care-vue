import React, { useState } from "react";
import { 
  Search, Filter, Plus, Download, Pill, Clock, Calendar, ChevronLeft, ChevronRight, 
  Edit, Eye, Trash, ArrowLeft, User, FileText, ClipboardList
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { AddMedicationDialog } from "./AddMedicationDialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PatientMedicationDetail from "./PatientMedicationDetail";

interface MedicationTabProps {
  branchId: string | undefined;
  branchName: string | undefined;
}

// Mock data for patients with medications
const mockPatients = [
  {
    id: "CL-3421",
    name: "Wendy Smith",
    email: "wendysmith@gmail.com",
    phone: "+44 20 7946 0587",
    location: "Milton Keynes, MK9 3NZ",
    status: "Active",
    avatar: "WS",
    dateOfBirth: "15/05/1972",
    gender: "Female",
    medicationCount: 3,
    lastUpdated: "12 May 2023"
  },
  {
    id: "CL-2356",
    name: "John Michael",
    email: "john.michael@hotmail.com",
    phone: "+44 20 7946 1122",
    location: "London, SW1A 1AA",
    status: "Active",
    avatar: "JM",
    dateOfBirth: "22/10/1968",
    gender: "Male",
    medicationCount: 2,
    lastUpdated: "05 Apr 2023"
  },
  {
    id: "CL-9876",
    name: "Lisa Rodrigues",
    email: "lisa.rod@outlook.com",
    phone: "+44 20 7946 3344",
    location: "Cambridge, CB2 1TN",
    status: "Active",
    avatar: "LR",
    dateOfBirth: "03/12/1985",
    gender: "Female",
    medicationCount: 4,
    lastUpdated: "15 May 2023"
  },
  {
    id: "CL-5432",
    name: "Kate Williams",
    email: "kate.w@company.co.uk",
    phone: "+44 20 7946 5566",
    location: "Bristol, BS1 5TR",
    status: "Active",
    avatar: "KW",
    dateOfBirth: "17/07/1979",
    gender: "Female",
    medicationCount: 1,
    lastUpdated: "21 May 2023"
  },
  {
    id: "CL-7890",
    name: "Robert Johnson",
    email: "r.johnson@gmail.com",
    phone: "+44 20 7946 7788",
    location: "Manchester, M1 1AE",
    status: "Active",
    avatar: "RJ",
    dateOfBirth: "30/03/1965",
    gender: "Male",
    medicationCount: 5,
    lastUpdated: "02 May 2023"
  },
  {
    id: "CL-1122",
    name: "Emma Thompson",
    email: "emma.t@gmail.com",
    phone: "+44 20 7946 9900",
    location: "Southampton, SO14 2AR",
    status: "Active",
    avatar: "ET",
    dateOfBirth: "08/11/1982",
    gender: "Female",
    medicationCount: 2,
    lastUpdated: "14 Apr 2023"
  },
  {
    id: "CL-3344",
    name: "David Wilson",
    email: "d.wilson@company.org",
    phone: "+44 20 7946 1234",
    location: "Norwich, NR1 3QU",
    status: "Active",
    avatar: "DW",
    dateOfBirth: "25/06/1970",
    gender: "Male",
    medicationCount: 3,
    lastUpdated: "16 May 2023"
  },
  {
    id: "CL-5566",
    name: "Olivia Parker",
    email: "olivia.p@outlook.com",
    phone: "+44 20 7946 5678",
    location: "Exeter, EX1 1LB",
    status: "Active",
    avatar: "OP",
    dateOfBirth: "14/02/1990",
    gender: "Female",
    medicationCount: 1,
    lastUpdated: "10 May 2023"
  }
];

export const MedicationTab = ({ branchId, branchName }: MedicationTabProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [addMedicationDialogOpen, setAddMedicationDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  
  const itemsPerPage = 5;
  
  const filteredPatients = mockPatients.filter(patient => {
    const matchesSearch = 
      patient.name.toLowerCase().includes(searchValue.toLowerCase()) || 
      patient.id.toLowerCase().includes(searchValue.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchValue.toLowerCase());
    
    return matchesSearch;
  });
  
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handleAddMedication = () => {
    setAddMedicationDialogOpen(true);
  };
  
  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
  };
  
  const handleBackToPatients = () => {
    setSelectedPatient(null);
  };

  const getSelectedPatient = () => {
    return mockPatients.find(patient => patient.id === selectedPatient);
  };
  
  // If a patient is selected, show their medication details
  if (selectedPatient) {
    const patient = getSelectedPatient();
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackToPatients} 
            className="mb-4 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-medium">
                {patient?.avatar || "??"}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{patient?.name || "Unknown Patient"}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span>ID: {patient?.id}</span>
                  <span>DOB: {patient?.dateOfBirth}</span>
                  <span>Gender: {patient?.gender}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline">
                <User className="h-4 w-4 mr-2" />
                Patient Profile
              </Button>
              <Button onClick={handleAddMedication}>
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </div>
          </div>
        </div>
        
        <PatientMedicationDetail patientId={selectedPatient} />
      </div>
    );
  }
  
  // Otherwise, show the patient list with medication counts
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Patient Medications</h2>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients..."
              className="pl-10 pr-4 w-full"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            
            <Button onClick={handleAddMedication}>
              <Plus className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Patients</p>
                <h3 className="text-2xl font-bold mt-1">{mockPatients.length}</h3>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <User className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Medications</p>
                <h3 className="text-2xl font-bold mt-1">21</h3>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Pill className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">MAR Records</p>
                <h3 className="text-2xl font-bold mt-1">48</h3>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <h3 className="text-2xl font-bold mt-1">3</h3>
              </div>
              <div className="p-3 rounded-full bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead className="hidden md:table-cell">DOB</TableHead>
              <TableHead className="hidden lg:table-cell">Contact</TableHead>
              <TableHead className="text-center">Medications</TableHead>
              <TableHead className="hidden md:table-cell">Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPatients.map((patient) => (
              <TableRow key={patient.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handlePatientSelect(patient.id)}>
                <TableCell className="font-medium">{patient.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                      {patient.avatar}
                    </div>
                    <div>
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-xs text-gray-500">{patient.gender}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {patient.dateOfBirth}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="text-sm">{patient.phone}</div>
                  <div className="text-xs text-gray-500">{patient.email}</div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {patient.medicationCount} medications
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-gray-500 text-sm">
                  {patient.lastUpdated}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePatientSelect(patient.id);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info(`Editing ${patient.name}'s medications`, {
                          description: "This feature is coming soon",
                        });
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredPatients.length > 0 ? (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePreviousPage} 
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
            <p className="text-gray-500">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
      
      {/* Dialog for adding new medication */}
      <AddMedicationDialog 
        open={addMedicationDialogOpen} 
        onOpenChange={setAddMedicationDialogOpen} 
      />
    </div>
  );
};
