
import React, { useState } from "react";
import { 
  Table, TableHeader, TableBody, TableHead, 
  TableRow, TableCell, TableFooter
} from "@/components/ui/table";
import { 
  Pagination, PaginationContent, PaginationItem, 
  PaginationLink, PaginationNext, PaginationPrevious
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Plus, FileText, Download, 
  Filter, ChevronDown, Eye, Edit, Trash2, 
  MoreHorizontal, ClipboardCheck
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Mock data for care plans
const mockCarePlans = [
  {
    id: "CP-001",
    patientName: "John Michael",
    patientId: "PT-2356",
    dateCreated: new Date("2023-10-15"),
    lastUpdated: new Date("2023-11-05"),
    status: "Active",
    assignedTo: "Dr. Sarah Johnson",
    avatar: "JM"
  },
  {
    id: "CP-002",
    patientName: "Emma Thompson",
    patientId: "PT-1122",
    dateCreated: new Date("2023-09-22"),
    lastUpdated: new Date("2023-10-30"),
    status: "Under Review",
    assignedTo: "Dr. James Wilson",
    avatar: "ET"
  },
  {
    id: "CP-003",
    patientName: "Wendy Smith",
    patientId: "PT-3421",
    dateCreated: new Date("2023-11-02"),
    lastUpdated: new Date("2023-11-10"),
    status: "Active",
    assignedTo: "Nurse David Brown",
    avatar: "WS"
  },
  {
    id: "CP-004",
    patientName: "Robert Johnson",
    patientId: "PT-7890",
    dateCreated: new Date("2023-08-15"),
    lastUpdated: new Date("2023-09-20"),
    status: "Archived",
    assignedTo: "Dr. Emma Lewis",
    avatar: "RJ"
  },
  {
    id: "CP-005",
    patientName: "Lisa Rodrigues",
    patientId: "PT-9876",
    dateCreated: new Date("2023-10-05"),
    lastUpdated: new Date("2023-11-01"),
    status: "Active",
    assignedTo: "Dr. Sarah Johnson",
    avatar: "LR"
  },
  {
    id: "CP-006",
    patientName: "David Wilson",
    patientId: "PT-3344",
    dateCreated: new Date("2023-07-18"),
    lastUpdated: new Date("2023-10-25"),
    status: "Under Review",
    assignedTo: "Nurse Michael Scott",
    avatar: "DW"
  },
  {
    id: "CP-007",
    patientName: "Kate Williams",
    patientId: "PT-5432",
    dateCreated: new Date("2023-09-30"),
    lastUpdated: new Date("2023-10-15"),
    status: "Active",
    assignedTo: "Dr. James Wilson",
    avatar: "KW"
  },
  {
    id: "CP-008",
    patientName: "Olivia Parker",
    patientId: "PT-5566",
    dateCreated: new Date("2023-06-22"),
    lastUpdated: new Date("2023-08-10"),
    status: "Archived",
    assignedTo: "Dr. Emma Lewis",
    avatar: "OP"
  }
];

// Available status options
const statusOptions = [
  { value: "Active", label: "Active", color: "text-green-600 bg-green-50 border-green-200" },
  { value: "Under Review", label: "Under Review", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "Archived", label: "Archived", color: "text-gray-600 bg-gray-50 border-gray-200" },
  { value: "On Hold", label: "On Hold", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "Completed", label: "Completed", color: "text-purple-600 bg-purple-50 border-purple-200" }
];

interface CareTabProps {
  branchId: string | undefined;
  branchName: string | undefined;
}

export const CareTab = ({ branchId, branchName }: CareTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { toast } = useToast();
  
  // State for the status change dialog
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  
  // Filter care plans based on search query
  const filteredCarePlans = mockCarePlans.filter(plan => 
    plan.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Paginate results
  const totalPages = Math.ceil(filteredCarePlans.length / itemsPerPage);
  const paginatedCarePlans = filteredCarePlans.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  
  const handleAddCarePlan = () => {
    console.log("Add care plan");
    // Implementation for adding a new care plan would go here
  };
  
  const handleViewCarePlan = (id: string) => {
    console.log(`View care plan: ${id}`);
    // Implementation for viewing a care plan would go here
  };
  
  const handleEditCarePlan = (id: string) => {
    console.log(`Edit care plan: ${id}`);
    // Implementation for editing a care plan would go here
  };
  
  const handleDeleteCarePlan = (id: string) => {
    console.log(`Delete care plan: ${id}`);
    // Implementation for deleting a care plan would go here
  };

  const openStatusChangeDialog = (id: string) => {
    // Find the current status of the care plan
    const plan = mockCarePlans.find(plan => plan.id === id);
    if (plan) {
      setSelectedPlan(id);
      setSelectedStatus(plan.status);
      setStatusDialogOpen(true);
    }
  };

  const handleStatusChange = () => {
    if (!selectedPlan || !selectedStatus) return;

    // In a real application, this would make an API call to update the status
    // For now, we'll just show a toast notification
    toast({
      title: "Status Updated",
      description: `Care plan ${selectedPlan} status changed to ${selectedStatus}`,
      variant: "default",
    });

    // Close the dialog
    setStatusDialogOpen(false);
    setSelectedPlan(null);
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Care Plans</h2>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search care plans..."
              className="pl-10 pr-4 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Export
            </Button>
            
            <Button onClick={handleAddCarePlan}>
              <Plus className="mr-2 h-4 w-4" />
              Add Care Plan
            </Button>
          </div>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Plan ID</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead className="hidden md:table-cell">Assigned To</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="hidden md:table-cell">Last Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCarePlans.length > 0 ? (
              paginatedCarePlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                        {plan.avatar}
                      </div>
                      <div>
                        <div className="font-medium">{plan.patientName}</div>
                        <div className="text-xs text-gray-500">{plan.patientId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {plan.assignedTo}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(plan.dateCreated, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(plan.lastUpdated, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        plan.status === "Active" ? "text-green-600 bg-green-50 border-green-200" :
                        plan.status === "Under Review" ? "text-amber-600 bg-amber-50 border-amber-200" :
                        plan.status === "Archived" ? "text-gray-600 bg-gray-50 border-gray-200" :
                        plan.status === "On Hold" ? "text-blue-600 bg-blue-50 border-blue-200" :
                        plan.status === "Completed" ? "text-purple-600 bg-purple-50 border-purple-200" :
                        "text-gray-600 bg-gray-50 border-gray-200"
                      )}
                    >
                      {plan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={() => handleViewCarePlan(plan.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCarePlan(plan.id)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openStatusChangeDialog(plan.id)}>
                          <ClipboardCheck className="mr-2 h-4 w-4" /> Change Status
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCarePlan(plan.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="h-10 w-10 text-gray-300 mb-2" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No care plans found</h3>
                    <p className="text-gray-500 mb-4">Get started by creating a new care plan</p>
                    <Button onClick={handleAddCarePlan}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Care Plan
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {filteredCarePlans.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCarePlans.length)} of {filteredCarePlans.length} care plans
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <span className="flex h-9 w-9 items-center justify-center">...</span>
                  </PaginationItem>
                )}
                
                {totalPages > 5 && currentPage < totalPages - 1 && (
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
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
      </div>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Care Plan Status</DialogTitle>
            <DialogDescription>
              Update the status for this care plan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="status" className="text-right text-sm font-medium">
                Status
              </label>
              <div className="col-span-3">
                <Select 
                  value={selectedStatus} 
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleStatusChange} type="button">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
