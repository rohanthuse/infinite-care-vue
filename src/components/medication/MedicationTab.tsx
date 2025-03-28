
import React, { useState } from "react";
import { 
  Search, Filter, Plus, Download, Pill, Clock, Calendar, ChevronLeft, ChevronRight, Edit, Eye, Trash
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { AddMedicationDialog } from "./AddMedicationDialog";
import { format } from "date-fns";
import { toast } from "sonner";

interface MedicationTabProps {
  branchId: string | undefined;
  branchName: string | undefined;
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
  },
  {
    id: "MED-002",
    name: "Amoxicillin",
    dosage: "250mg",
    frequency: "3 times a day",
    startDate: "2023-05-15",
    endDate: "2023-05-22",
    patient: "John Michael",
    patientId: "CL-2356",
    prescribedBy: "Dr. Emma Thompson",
    status: "Completed",
  },
  {
    id: "MED-003",
    name: "Ibuprofen",
    dosage: "400mg",
    frequency: "3 times a day",
    startDate: "2023-05-18",
    endDate: "2023-05-25",
    patient: "Lisa Rodrigues",
    patientId: "CL-9876",
    prescribedBy: "Dr. James Wilson",
    status: "Active",
  },
  {
    id: "MED-004",
    name: "Aspirin",
    dosage: "75mg",
    frequency: "Once daily",
    startDate: "2023-04-20",
    endDate: "2024-04-20",
    patient: "Kate Williams",
    patientId: "CL-5432",
    prescribedBy: "Dr. Michael Scott",
    status: "Active",
  },
  {
    id: "MED-005",
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    startDate: "2023-03-15",
    endDate: "2023-09-15",
    patient: "Robert Johnson",
    patientId: "CL-7890",
    prescribedBy: "Dr. Emma Thompson",
    status: "Active",
  },
  {
    id: "MED-006",
    name: "Atorvastatin",
    dosage: "20mg",
    frequency: "Once daily (evening)",
    startDate: "2023-02-10",
    endDate: "2023-08-10",
    patient: "Emma Thompson",
    patientId: "CL-1122",
    prescribedBy: "Dr. Michael Scott",
    status: "Paused",
  },
  {
    id: "MED-007",
    name: "Salbutamol Inhaler",
    dosage: "2 puffs",
    frequency: "As needed",
    startDate: "2023-04-05",
    endDate: "2023-10-05",
    patient: "David Wilson",
    patientId: "CL-3344",
    prescribedBy: "Dr. James Wilson",
    status: "Active",
  },
  {
    id: "MED-008",
    name: "Sertraline",
    dosage: "50mg",
    frequency: "Once daily",
    startDate: "2023-01-20",
    endDate: "2023-07-20",
    patient: "Olivia Parker",
    patientId: "CL-5566",
    prescribedBy: "Dr. Emma Thompson",
    status: "Completed",
  }
];

export const MedicationTab = ({ branchId, branchName }: MedicationTabProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [addMedicationDialogOpen, setAddMedicationDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);
  
  const itemsPerPage = 5;
  
  const filteredMedications = mockMedications.filter(medication => {
    const matchesSearch = 
      medication.name.toLowerCase().includes(searchValue.toLowerCase()) || 
      medication.id.toLowerCase().includes(searchValue.toLowerCase()) ||
      medication.patient.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || medication.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const totalPages = Math.ceil(filteredMedications.length / itemsPerPage);
  const paginatedMedications = filteredMedications.slice(
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
  
  const handleViewMedication = (id: string) => {
    setSelectedMedication(id);
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
  
  const getDashboardStats = () => {
    const total = mockMedications.length;
    const active = mockMedications.filter(med => med.status === "Active").length;
    const completed = mockMedications.filter(med => med.status === "Completed").length;
    const paused = mockMedications.filter(med => med.status === "Paused").length;
    
    return { total, active, completed, paused };
  };
  
  const stats = getDashboardStats();
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Medication Management</h2>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search medications..."
              className="pl-10 pr-4 w-full"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={handleAddMedication}>
            <Plus className="mr-2 h-4 w-4" />
            Add Medication
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Medications</p>
                <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <Pill className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Active Medications</p>
                <h3 className="text-2xl font-bold mt-1">{stats.active}</h3>
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
                <p className="text-sm text-gray-500">Completed</p>
                <h3 className="text-2xl font-bold mt-1">{stats.completed}</h3>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Pill className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Paused Medications</p>
                <h3 className="text-2xl font-bold mt-1">{stats.paused}</h3>
              </div>
              <div className="p-3 rounded-full bg-amber-100">
                <Pill className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Medication</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead className="hidden md:table-cell">Dosage</TableHead>
              <TableHead className="hidden lg:table-cell">Frequency</TableHead>
              <TableHead className="hidden md:table-cell">Start Date</TableHead>
              <TableHead className="hidden lg:table-cell">End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMedications.map((medication) => (
              <TableRow key={medication.id}>
                <TableCell className="font-medium">{medication.id}</TableCell>
                <TableCell>
                  <div className="font-medium">{medication.name}</div>
                  <div className="text-xs text-gray-500">Prescribed by: {medication.prescribedBy}</div>
                </TableCell>
                <TableCell>
                  <div>{medication.patient}</div>
                  <div className="text-xs text-gray-500">{medication.patientId}</div>
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
        
        {filteredMedications.length > 0 ? (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredMedications.length)} of {filteredMedications.length} medications
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
            <h3 className="text-lg font-medium text-gray-900 mb-1">No medications found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
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
