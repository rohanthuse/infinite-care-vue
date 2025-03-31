
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationNext, PaginationLink, PaginationPrevious
} from "@/components/ui/pagination";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertCircle, AlertTriangle, Calendar, CheckCircle, Clock, Download,
  Edit, Eye, FileText, MoreHorizontal, Pill, Plus, RefreshCw, Search, 
  Trash2, Clock4
} from "lucide-react";

export interface MedicationTabProps {
  branchId?: string;
  branchName?: string;
}

// Mock data
const mockMedications = [
  {
    id: "MED-001",
    name: "Amoxicillin",
    patientName: "John Smith",
    patientId: "PT-12345",
    prescribedBy: "Dr. Sarah Johnson",
    dosage: "250mg",
    frequency: "3 times daily",
    startDate: new Date("2023-06-15"),
    status: "Active",
    nextDue: new Date("2023-06-15T14:30:00"),
    avatar: "JS"
  },
  {
    id: "MED-002",
    name: "Lisinopril",
    patientName: "Mary Williams",
    patientId: "PT-67890",
    prescribedBy: "Dr. James Wilson",
    dosage: "10mg",
    frequency: "Once daily",
    startDate: new Date("2023-05-22"),
    status: "Active",
    nextDue: new Date("2023-06-15T09:00:00"),
    avatar: "MW"
  },
  {
    id: "MED-003",
    name: "Metformin",
    patientName: "Robert Johnson",
    patientId: "PT-45678",
    prescribedBy: "Dr. Emily Chen",
    dosage: "500mg",
    frequency: "Twice daily",
    startDate: new Date("2023-04-10"),
    status: "On Hold",
    nextDue: null,
    avatar: "RJ"
  }
];

const upcomingAdministrations = [
  {
    id: "ADM-001",
    patientName: "John Smith",
    patientId: "PT-12345",
    medicationName: "Amoxicillin",
    medicationId: "MED-001",
    dosage: "250mg",
    scheduledTime: new Date("2023-06-15T14:30:00"),
    status: "Due Soon",
    avatar: "JS"
  },
  {
    id: "ADM-002",
    patientName: "Mary Williams",
    patientId: "PT-67890",
    medicationName: "Lisinopril",
    medicationId: "MED-002",
    dosage: "10mg",
    scheduledTime: new Date("2023-06-15T09:00:00"),
    status: "Scheduled",
    avatar: "MW"
  }
];

const recentAdministrations = [
  {
    id: "ADM-003",
    patientName: "John Smith",
    patientId: "PT-12345",
    medicationName: "Amoxicillin",
    medicationId: "MED-001",
    dosage: "250mg",
    administeredTime: new Date("2023-06-14T14:30:00"),
    administeredBy: "Nurse Alice",
    status: "Administered",
    notes: "Patient took medication without issues",
    avatar: "JS"
  },
  {
    id: "ADM-004",
    patientName: "Robert Johnson",
    patientId: "PT-45678",
    medicationName: "Metformin",
    medicationId: "MED-003",
    dosage: "500mg",
    administeredTime: new Date("2023-06-14T10:15:00"),
    administeredBy: "Nurse Thomas",
    status: "Administered",
    notes: "Patient complained of mild nausea",
    avatar: "RJ"
  }
];

export const MedicationTab: React.FC<MedicationTabProps> = ({ branchId, branchName }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [addMedicationDialogOpen, setAddMedicationDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<null | string>(null);
  const [administrationDate, setAdministrationDate] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [administrationNotes, setAdministrationNotes] = useState<string>("");
  const { toast } = useToast();
  const itemsPerPage = 5;

  const filteredMedications = mockMedications.filter(med => {
    const matchesSearch = 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || med.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const totalPages = Math.ceil(filteredMedications.length / itemsPerPage);
  const paginatedMedications = filteredMedications.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-600 bg-green-50 border-green-200";
      case "Completed":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "On Hold":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "Discontinued":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getAdminStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Administered":
        return "text-green-600 bg-green-50 border-green-200";
      case "Due Soon":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "Scheduled":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "Missed":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const handleRecordAdministration = (medicationId: string) => {
    setSelectedMedication(medicationId);
    setRecordDialogOpen(true);
  };

  const handleSubmitAdministration = () => {
    console.log("Recording administration for:", selectedMedication);
    console.log("Date/Time:", administrationDate);
    console.log("Notes:", administrationNotes);
    
    toast({
      title: "Administration Recorded",
      description: "The medication administration has been successfully recorded.",
    });
    
    setRecordDialogOpen(false);
    setSelectedMedication(null);
    setAdministrationNotes("");
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Medication Management</h2>
      <p className="text-gray-500 mb-6">Track and manage medications for clients.</p>
      
      <Tabs defaultValue="medications" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="medications" className="flex items-center">
              <Pill className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Medications</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <Clock4 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search medications..."
                className="pl-10 pr-4 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button onClick={() => setAddMedicationDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </div>
        </div>
        
        <TabsContent value="medications" className="space-y-4">
          {/* Simplified medication list content */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMedications.map((medication) => (
                    <TableRow key={medication.id}>
                      <TableCell className="font-medium">{medication.id}</TableCell>
                      <TableCell className="font-medium">{medication.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {medication.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{medication.patientName}</div>
                            <div className="text-xs text-gray-500">{medication.patientId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getStatusBadgeClass(medication.status)}
                        >
                          {medication.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleRecordAdministration(medication.id)}
                            disabled={medication.status !== "Active"}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedMedications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No medications found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {filteredMedications.length > 0 && (
            <div className="flex items-center justify-between px-2">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredMedications.length)} of {filteredMedications.length} medications
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Administrations</CardTitle>
              <CardDescription>Scheduled medications for today and upcoming days</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Schedule content simplified for brevity.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medication History</CardTitle>
              <CardDescription>Previously administered medications</CardDescription>
            </CardHeader>
            <CardContent>
              <p>History content simplified for brevity.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Medication Administration</DialogTitle>
            <DialogDescription>
              Record when a medication was administered to a patient.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedMedication && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-blue-50 border border-blue-100">
                <Pill className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">
                    {mockMedications.find(m => m.id === selectedMedication)?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {mockMedications.find(m => m.id === selectedMedication)?.dosage} - 
                    {mockMedications.find(m => m.id === selectedMedication)?.patientName}
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="admin-date" className="text-right text-sm font-medium">
                Date & Time
              </label>
              <div className="col-span-3">
                <Input
                  id="admin-date"
                  type="datetime-local"
                  value={administrationDate}
                  onChange={(e) => setAdministrationDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="admin-notes" className="text-right text-sm font-medium">
                Notes
              </label>
              <div className="col-span-3">
                <textarea
                  id="admin-notes"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  placeholder="Add any relevant notes about the administration"
                  value={administrationNotes}
                  onChange={(e) => setAdministrationNotes(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSubmitAdministration}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Record Administration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
