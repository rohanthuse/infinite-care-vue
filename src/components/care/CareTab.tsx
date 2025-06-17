
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  MoreHorizontal, ClipboardCheck, Calendar
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateCarePlanPDF } from "@/utils/pdfGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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

const statusOptions = [
  { value: "Active", label: "Active", color: "text-green-600 bg-green-50 border-green-200" },
  { value: "Under Review", label: "Under Review", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "Archived", label: "Archived", color: "text-gray-600 bg-gray-50 border-gray-200" },
  { value: "On Hold", label: "On Hold", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "Completed", label: "Completed", color: "text-purple-600 bg-purple-50 border-purple-200" }
];

const assignedToOptions = [
  { value: "Dr. Sarah Johnson", label: "Dr. Sarah Johnson" },
  { value: "Dr. James Wilson", label: "Dr. James Wilson" },
  { value: "Dr. Emma Lewis", label: "Dr. Emma Lewis" },
  { value: "Nurse David Brown", label: "Nurse David Brown" },
  { value: "Nurse Michael Scott", label: "Nurse Michael Scott" }
];

interface CareTabProps {
  branchId: string | undefined;
  branchName: string | undefined;
}

// Add a hook to fetch care plans from database with fallback to mock data
const useCarePlans = (branchId: string | undefined) => {
  return useQuery({
    queryKey: ['care-plans', branchId],
    queryFn: async () => {
      if (!branchId) return mockCarePlans;
      
      try {
        console.log('[useCarePlans] Fetching care plans for branch:', branchId);
        
        // Try to fetch from database
        const { data: carePlans, error } = await supabase
          .from('client_care_plans')
          .select(`
            *,
            client:clients(*)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[useCarePlans] Database query error:', error);
          // Fallback to mock data if database query fails
          return mockCarePlans;
        }

        if (!carePlans || carePlans.length === 0) {
          console.log('[useCarePlans] No care plans found in database, using mock data');
          return mockCarePlans;
        }

        // Transform database data to match expected format
        const transformedPlans = carePlans.map(plan => ({
          id: plan.id.substring(0, 8).toUpperCase(), // Use first 8 chars as display ID
          patientName: plan.client ? `${plan.client.first_name} ${plan.client.last_name}` : "Unknown Patient",
          patientId: plan.client?.other_identifier || `PT-${Math.floor(Math.random() * 9999)}`,
          dateCreated: new Date(plan.created_at),
          lastUpdated: new Date(plan.updated_at),
          status: plan.status === 'active' ? 'Active' : 
                 plan.status === 'under_review' ? 'Under Review' : 
                 plan.status === 'archived' ? 'Archived' : 'Active',
          assignedTo: plan.provider_name || "Care Provider",
          avatar: plan.client?.avatar_initials || 
                 (plan.client ? `${plan.client.first_name?.[0] || ''}${plan.client.last_name?.[0] || ''}` : 'UK')
        }));

        console.log('[useCarePlans] Successfully transformed care plans:', transformedPlans);
        return transformedPlans;
      } catch (error) {
        console.error('[useCarePlans] Unexpected error:', error);
        return mockCarePlans;
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
};

export const CareTab = ({ branchId, branchName }: CareTabProps) => {
  // Move ALL hooks to the top, before any conditional logic
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use the hook to fetch care plans - MUST be at the top
  const { data: carePlans = [], isLoading, error } = useCarePlans(branchId);
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("all");
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined);
  const [isFiltering, setIsFiltering] = useState(false);

  // useEffect hooks MUST also be at the top
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, assignedToFilter, dateRangeStart, dateRangeEnd]);
  
  // NOW we can do conditional rendering after all hooks are declared
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading care plans...</span>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('[CareTab] Error loading care plans:', error);
  }
  
  const filteredCarePlans = carePlans.filter(plan => {
    const matchesSearch = 
      plan.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter && statusFilter !== "all" && plan.status !== statusFilter) return false;
    
    if (assignedToFilter && assignedToFilter !== "all" && plan.assignedTo !== assignedToFilter) return false;
    
    if (dateRangeStart && isBefore(plan.lastUpdated, dateRangeStart)) return false;
    if (dateRangeEnd) {
      const endDatePlusOne = new Date(dateRangeEnd);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      if (isAfter(plan.lastUpdated, endDatePlusOne)) return false;
    }
    
    return true;
  });
  
  const totalPages = Math.ceil(filteredCarePlans.length / itemsPerPage);
  const paginatedCarePlans = filteredCarePlans.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, assignedToFilter, dateRangeStart, dateRangeEnd]);
  
  const handleAddCarePlan = () => {
    console.log("Add care plan");
  };
  
  const handleViewCarePlan = (id: string) => {
    if (branchId && branchName) {
      navigate(`/branch-dashboard/${branchId}/${branchName}/care-plan/${id}`);
    }
  };
  
  const handleEditCarePlan = (id: string) => {
    console.log(`Edit care plan: ${id}`);
  };
  
  const handleDeleteCarePlan = (id: string) => {
    console.log(`Delete care plan: ${id}`);
  };

  const openStatusChangeDialog = (id: string) => {
    const plan = mockCarePlans.find(plan => plan.id === id);
    if (plan) {
      setSelectedPlan(id);
      setSelectedStatus(plan.status);
      setStatusDialogOpen(true);
    }
  };

  const handleStatusChange = () => {
    if (!selectedPlan || !selectedStatus) return;

    toast({
      title: "Status Updated",
      description: `Care plan ${selectedPlan} status changed to ${selectedStatus}`,
      variant: "default",
    });

    setStatusDialogOpen(false);
    setSelectedPlan(null);
  };

  const handleFilterApply = () => {
    setIsFiltering(statusFilter !== "all" || assignedToFilter !== "all" || !!dateRangeStart || !!dateRangeEnd);
    setFilterDialogOpen(false);
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setAssignedToFilter("all");
    setDateRangeStart(undefined);
    setDateRangeEnd(undefined);
    setIsFiltering(false);
    setFilterDialogOpen(false);
  };

  const handleExportToPDF = () => {
    generateCarePlanPDF(
      filteredCarePlans,
      branchName || "Med-Infinite Branch",
      isFiltering ? "Filtered Care Plans" : "All Care Plans"
    );
    
    toast({
      title: "Export Successful",
      description: "Care plans have been exported to PDF",
      variant: "default",
    });
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
            <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className={cn(isFiltering && "border-blue-500 bg-blue-50 text-blue-600")}>
                  <Filter className="mr-2 h-4 w-4" />
                  {isFiltering ? "Filters Applied" : "Filter"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Filter Care Plans</DialogTitle>
                  <DialogDescription>
                    Apply filters to narrow down the care plans list.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="status-filter" className="text-right text-sm font-medium">
                      Status
                    </label>
                    <div className="col-span-3">
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="assigned-filter" className="text-right text-sm font-medium">
                      Assigned To
                    </label>
                    <div className="col-span-3">
                      <Select
                        value={assignedToFilter}
                        onValueChange={setAssignedToFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Providers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Providers</SelectItem>
                          {assignedToOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">
                      Date Range
                    </label>
                    <div className="col-span-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">From:</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRangeStart && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {dateRangeStart ? format(dateRangeStart, "MMM dd, yyyy") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={dateRangeStart}
                              onSelect={setDateRangeStart}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">To:</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRangeEnd && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {dateRangeEnd ? format(dateRangeEnd, "MMM dd, yyyy") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={dateRangeEnd}
                              onSelect={setDateRangeEnd}
                              initialFocus
                              className="p-3 pointer-events-auto"
                              disabled={(date) => dateRangeStart ? isBefore(date, dateRangeStart) : false}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                  <Button onClick={handleFilterApply}>
                    Apply Filters
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={handleExportToPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            
            <Button onClick={handleAddCarePlan}>
              <Plus className="mr-2 h-4 w-4" />
              Add Care Plan
            </Button>
          </div>
        </div>
      </div>

      {isFiltering && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">Active filters:</span>
          {statusFilter !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
              Status: {statusFilter}
            </Badge>
          )}
          {assignedToFilter !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
              Assigned to: {assignedToFilter}
            </Badge>
          )}
          {dateRangeStart && (
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
              From: {format(dateRangeStart, "MMM dd, yyyy")}
            </Badge>
          )}
          {dateRangeEnd && (
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
              To: {format(dateRangeEnd, "MMM dd, yyyy")}
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0"
            onClick={handleClearFilters}
          >
            Clear all
          </Button>
        </div>
      )}
      
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
