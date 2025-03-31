
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableHeader, TableBody, TableHead, 
  TableRow, TableCell, TableFooter
} from "@/components/ui/table";
import { 
  Pagination, PaginationContent, PaginationItem, 
  PaginationLink, PaginationNext, PaginationPrevious
} from "@/components/ui/pagination";
import { 
  Card, CardContent, CardDescription, CardFooter, 
  CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Plus, CheckCircle, Clock, AlertTriangle, 
  AlertCircle, Calendar, Filter, Download, MoreHorizontal,
  Edit, Trash2, Eye, Pill, RefreshCw, Clock4, ChevronDown,
  ArrowUpDown, Clipboard, FileText, X
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AddMedicationDialog } from "./AddMedicationDialog";
import { useToast } from "@/hooks/use-toast";

export interface MedicationTabProps {
  branchId?: string;
  branchName?: string;
}

const mockMedications = [
  {
    id: "MED-001",
    name: "Lisinopril",
    patientName: "John Michael",
    patientId: "PT-2356",
    dosage: "10mg",
    frequency: "Once daily",
    startDate: new Date("2023-10-10"),
    endDate: new Date("2023-12-10"),
    status: "Active",
    lastAdministered: new Date("2023-11-18T08:30:00"),
    nextDue: new Date("2023-11-19T08:30:00"),
    notes: "Take with food in the morning",
    prescribedBy: "Dr. Sarah Johnson",
    avatar: "JM"
  },
  {
    id: "MED-002",
    name: "Metformin",
    patientName: "Emma Thompson",
    patientId: "PT-1122",
    dosage: "500mg",
    frequency: "Twice daily",
    startDate: new Date("2023-09-15"),
    endDate: new Date("2024-03-15"),
    status: "Active",
    lastAdministered: new Date("2023-11-18T09:00:00"),
    nextDue: new Date("2023-11-18T21:00:00"),
    notes: "Take with meals",
    prescribedBy: "Dr. James Wilson",
    avatar: "ET"
  },
  {
    id: "MED-003",
    name: "Amlodipine",
    patientName: "Wendy Smith",
    patientId: "PT-3421",
    dosage: "5mg",
    frequency: "Once daily",
    startDate: new Date("2023-11-01"),
    endDate: new Date("2024-02-01"),
    status: "Active",
    lastAdministered: new Date("2023-11-18T07:45:00"),
    nextDue: new Date("2023-11-19T07:45:00"),
    notes: "Take in the evening",
    prescribedBy: "Dr. Emma Lewis",
    avatar: "WS"
  },
  {
    id: "MED-004",
    name: "Simvastatin",
    patientName: "Robert Johnson",
    patientId: "PT-7890",
    dosage: "20mg",
    frequency: "Once daily",
    startDate: new Date("2023-10-05"),
    endDate: new Date("2024-04-05"),
    status: "Active",
    lastAdministered: new Date("2023-11-18T20:00:00"),
    nextDue: new Date("2023-11-19T20:00:00"),
    notes: "Take in the evening",
    prescribedBy: "Dr. Sarah Johnson",
    avatar: "RJ"
  },
  {
    id: "MED-005",
    name: "Aspirin",
    patientName: "Lisa Rodrigues",
    patientId: "PT-9876",
    dosage: "81mg",
    frequency: "Once daily",
    startDate: new Date("2023-09-20"),
    endDate: new Date("2024-03-20"),
    status: "Active",
    lastAdministered: new Date("2023-11-18T08:15:00"),
    nextDue: new Date("2023-11-19T08:15:00"),
    notes: "Take with food",
    prescribedBy: "Dr. James Wilson",
    avatar: "LR"
  },
  {
    id: "MED-006",
    name: "Furosemide",
    patientName: "David Wilson",
    patientId: "PT-3344",
    dosage: "40mg",
    frequency: "Once daily",
    startDate: new Date("2023-10-15"),
    endDate: new Date("2023-11-15"),
    status: "Completed",
    lastAdministered: new Date("2023-11-15T07:30:00"),
    nextDue: null,
    notes: "Take in the morning",
    prescribedBy: "Dr. Emma Lewis",
    avatar: "DW"
  },
  {
    id: "MED-007",
    name: "Levothyroxine",
    patientName: "Kate Williams",
    patientId: "PT-5432",
    dosage: "50mcg",
    frequency: "Once daily",
    startDate: new Date("2023-09-10"),
    endDate: new Date("2024-09-10"),
    status: "Active",
    lastAdministered: new Date("2023-11-18T07:00:00"),
    nextDue: new Date("2023-11-19T07:00:00"),
    notes: "Take on empty stomach, 30 minutes before breakfast",
    prescribedBy: "Dr. Sarah Johnson",
    avatar: "KW"
  },
  {
    id: "MED-008",
    name: "Ibuprofen",
    patientName: "Olivia Parker",
    patientId: "PT-5566",
    dosage: "400mg",
    frequency: "As needed",
    startDate: new Date("2023-11-10"),
    endDate: new Date("2023-11-20"),
    status: "On Hold",
    lastAdministered: new Date("2023-11-15T14:00:00"),
    nextDue: null,
    notes: "Take with food for pain. On hold due to gastric discomfort.",
    prescribedBy: "Dr. James Wilson",
    avatar: "OP"
  }
];

// Upcoming administrations based on the medications
const upcomingAdministrations = [
  {
    id: "ADM-001",
    medicationId: "MED-001",
    medicationName: "Lisinopril",
    patientName: "John Michael",
    patientId: "PT-2356",
    scheduledTime: new Date("2023-11-19T08:30:00"),
    status: "Scheduled",
    dosage: "10mg",
    avatar: "JM"
  },
  {
    id: "ADM-002",
    medicationId: "MED-002",
    medicationName: "Metformin",
    patientName: "Emma Thompson",
    patientId: "PT-1122",
    scheduledTime: new Date("2023-11-18T21:00:00"),
    status: "Due Soon",
    dosage: "500mg",
    avatar: "ET"
  },
  {
    id: "ADM-003",
    medicationId: "MED-003",
    medicationName: "Amlodipine",
    patientName: "Wendy Smith",
    patientId: "PT-3421",
    scheduledTime: new Date("2023-11-19T07:45:00"),
    status: "Scheduled",
    dosage: "5mg",
    avatar: "WS"
  },
  {
    id: "ADM-004",
    medicationId: "MED-004",
    medicationName: "Simvastatin",
    patientName: "Robert Johnson",
    patientId: "PT-7890",
    scheduledTime: new Date("2023-11-19T20:00:00"),
    status: "Scheduled",
    dosage: "20mg",
    avatar: "RJ"
  },
  {
    id: "ADM-005",
    medicationId: "MED-005",
    medicationName: "Aspirin",
    patientName: "Lisa Rodrigues",
    patientId: "PT-9876",
    scheduledTime: new Date("2023-11-19T08:15:00"),
    status: "Scheduled",
    dosage: "81mg",
    avatar: "LR"
  },
  {
    id: "ADM-006",
    medicationId: "MED-007",
    medicationName: "Levothyroxine",
    patientName: "Kate Williams",
    patientId: "PT-5432",
    scheduledTime: new Date("2023-11-19T07:00:00"),
    status: "Scheduled",
    dosage: "50mcg",
    avatar: "KW"
  },
];

// Recent administrations based on the medications
const recentAdministrations = [
  {
    id: "HIST-001",
    medicationId: "MED-001",
    medicationName: "Lisinopril",
    patientName: "John Michael",
    patientId: "PT-2356",
    administeredTime: new Date("2023-11-18T08:30:00"),
    status: "Administered",
    dosage: "10mg",
    administeredBy: "Nurse David Brown",
    notes: "Taken without issues",
    avatar: "JM"
  },
  {
    id: "HIST-002",
    medicationId: "MED-002",
    medicationName: "Metformin",
    patientName: "Emma Thompson",
    patientId: "PT-1122",
    administeredTime: new Date("2023-11-18T09:00:00"),
    status: "Administered",
    dosage: "500mg",
    administeredBy: "Nurse Michael Scott",
    notes: "Taken with breakfast",
    avatar: "ET"
  },
  {
    id: "HIST-003",
    medicationId: "MED-003",
    medicationName: "Amlodipine",
    patientName: "Wendy Smith",
    patientId: "PT-3421",
    administeredTime: new Date("2023-11-18T07:45:00"),
    status: "Administered",
    dosage: "5mg",
    administeredBy: "Nurse David Brown",
    notes: "Taken without issues",
    avatar: "WS"
  },
  {
    id: "HIST-004",
    medicationId: "MED-008",
    medicationName: "Ibuprofen",
    patientName: "Olivia Parker",
    patientId: "PT-5566",
    administeredTime: new Date("2023-11-15T14:00:00"),
    status: "Administered",
    dosage: "400mg",
    administeredBy: "Nurse Michael Scott",
    notes: "Patient reported gastric discomfort. Put on hold.",
    avatar: "OP"
  },
  {
    id: "HIST-005",
    medicationId: "MED-006",
    medicationName: "Furosemide",
    patientName: "David Wilson",
    patientId: "PT-3344",
    administeredTime: new Date("2023-11-15T07:30:00"),
    status: "Administered",
    dosage: "40mg",
    administeredBy: "Nurse David Brown",
    notes: "Final dose administered. Treatment completed.",
    avatar: "DW"
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

  // Filter medications based on search query and status filter
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
            
            <AddMedicationDialog 
              open={addMedicationDialogOpen} 
              onOpenChange={setAddMedicationDialogOpen} 
            />
            
            <Button onClick={() => setAddMedicationDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </div>
        </div>
        
        <TabsContent value="medications" className="space-y-4">
          <div className="flex mb-4 items-center gap-2">
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
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead className="w-[200px]">Medication</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden md:table-cell">Prescribed By</TableHead>
                  <TableHead className="hidden md:table-cell">Dosage & Frequency</TableHead>
                  <TableHead className="hidden md:table-cell">Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMedications.length > 0 ? (
                  paginatedMedications.map((medication) => (
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
                      <TableCell className="hidden md:table-cell">
                        {medication.prescribedBy}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="font-medium text-sm">{medication.dosage}</div>
                        <div className="text-xs text-gray-500">{medication.frequency}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(medication.startDate, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getStatusBadgeClass(medication.status)}
                        >
                          {medication.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {medication.nextDue ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span className="text-sm">{format(medication.nextDue, 'MMM dd, HH:mm')}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleRecordAdministration(medication.id)}
                                  disabled={medication.status !== "Active"}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Record Administration</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {medication.status === "Active" && (
                                <DropdownMenuItem>
                                  <AlertCircle className="mr-2 h-4 w-4" /> Put On Hold
                                </DropdownMenuItem>
                              )}
                              {medication.status === "On Hold" && (
                                <DropdownMenuItem>
                                  <RefreshCw className="mr-2 h-4 w-4" /> Resume
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No medications found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
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
        
        <TabsContent value="schedule" className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Upcoming Administrations</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Scheduled Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingAdministrations.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {admin.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{admin.patientName}</div>
                          <div className="text-xs text-gray-500">{admin.patientId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{admin.medicationName}</TableCell>
                    <TableCell>{admin.dosage}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{format(admin.scheduledTime, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{format(admin.scheduledTime, 'HH:mm')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getAdminStatusBadgeClass(admin.status)}
                      >
                        {admin.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleRecordAdministration(admin.medicationId)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Record Administration</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Today's Overview</CardTitle>
                <CardDescription>Medication administration for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Administered</div>
                      <div className="text-sm text-gray-500">Completed today</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">8</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-medium">Due Soon</div>
                      <div className="text-sm text-gray-500">Due in next 2 hours</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">3</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Scheduled</div>
                      <div className="text-sm text-gray-500">Later today</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">5</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium">Missed</div>
                      <div className="text-sm text-gray-500">Not administered</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">1</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Upcoming This Week</CardTitle>
                <CardDescription>Medication schedule summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="font-medium">{day}</div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-100 text-green-600 hover:bg-green-200">
                          {10 + index} AM
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-200">
                          {4 + Math.floor(index/2)} PM
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Medication Compliance</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center my-2">
                  <div className="h-24 w-24 rounded-full border-8 border-green-500 flex items-center justify-center">
                    <span className="text-2xl font-bold">94%</span>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Administered on time</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Administered late</span>
                    <span className="font-medium">4%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Missed</span>
                    <span className="font-medium">2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Recent Administrations</h3>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export History
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Administered</TableHead>
                  <TableHead className="hidden md:table-cell">Administered By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAdministrations.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {admin.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{admin.patientName}</div>
                          <div className="text-xs text-gray-500">{admin.patientId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{admin.medicationName}</div>
                      <div className="text-xs text-gray-500">{admin.dosage}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{format(admin.administeredTime, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{format(admin.administeredTime, 'HH:mm')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{admin.administeredBy}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="text-green-600 bg-green-50 border-green-200"
                      >
                        {admin.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                      {admin.notes}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
