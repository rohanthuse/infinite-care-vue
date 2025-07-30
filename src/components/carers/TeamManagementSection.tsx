
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Shield, UserCheck, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AddCarerDialog } from "./AddCarerDialog";
import { EditCarerDialog } from "./EditCarerDialog";
import { SetCarerPasswordDialog } from "./SetCarerPasswordDialog";
import { StatusChangeDialog } from "./StatusChangeDialog";
import { BulkActionsBar } from "./BulkActionsBar";
import { StatusFilterStats } from "./StatusFilterStats";
import { CarerFilters } from "./CarerFilters";
import { useBranchCarers, CarerDB, useDeleteCarer, useUpdateCarer } from "@/data/hooks/useBranchCarers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface TeamManagementSectionProps {
  branchId: string;
  branchName?: string;
}

const ITEMS_PER_PAGE = 10;

export function TeamManagementSection({ branchId, branchName }: TeamManagementSectionProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCarer, setEditingCarer] = useState<CarerDB | null>(null);
  const [settingPasswordCarer, setSettingPasswordCarer] = useState<CarerDB | null>(null);
  const [deletingCarer, setDeletingCarer] = useState<CarerDB | null>(null);
  const [selectedCarers, setSelectedCarers] = useState<CarerDB[]>([]);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);

  const { data: carers = [], isLoading } = useBranchCarers(branchId);
  const deleteMutation = useDeleteCarer();
  const updateCarerMutation = useUpdateCarer();

  const handleViewDetails = (carer: CarerDB) => {
    navigate(`/branch-dashboard/${branchId}/${encodeURIComponent(branchName || '')}/carers/${carer.id}`);
  };

  const filteredCarers = useMemo(() => {
    return carers.filter(carer => {
      const matchesSearch = 
        `${carer.first_name} ${carer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carer.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || carer.status === statusFilter;
      const matchesSpecialization = specializationFilter === "all" || carer.specialization === specializationFilter;
      
      return matchesSearch && matchesStatus && matchesSpecialization;
    });
  }, [carers, searchTerm, statusFilter, specializationFilter]);

  const totalPages = Math.ceil(filteredCarers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCarers = filteredCarers.slice(startIndex, endIndex);

  const handleDelete = async () => {
    if (!deletingCarer) return;
    
    try {
      await deleteMutation.mutateAsync(deletingCarer.id);
      setDeletingCarer(null);
      // Remove from selection if selected
      setSelectedCarers(prev => prev.filter(c => c.id !== deletingCarer.id));
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleBulkStatusChange = async (carerIds: string[], newStatus: string, reason?: string) => {
    try {
      // Update each carer's status
      for (const carerId of carerIds) {
        await updateCarerMutation.mutateAsync({
          id: carerId,
          status: newStatus
        });
      }
      
      toast.success(`Status updated for ${carerIds.length} staff member${carerIds.length > 1 ? 's' : ''}`, {
        description: reason ? `Reason: ${reason}` : undefined
      });
      
      // Clear selection
      setSelectedCarers([]);
    } catch (error) {
      toast.error("Failed to update status", {
        description: "Some staff members may not have been updated successfully."
      });
    }
  };

  const handleCarerSelection = (carer: CarerDB, checked: boolean) => {
    if (checked) {
      setSelectedCarers(prev => [...prev, carer]);
    } else {
      setSelectedCarers(prev => prev.filter(c => c.id !== carer.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCarers(paginatedCarers);
    } else {
      setSelectedCarers([]);
    }
  };

  const isCarerSelected = (carer: CarerDB) => {
    return selectedCarers.some(c => c.id === carer.id);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending invitation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on leave':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'training':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const hasAuthAccount = (carer: CarerDB) => {
    return carer.invitation_accepted_at || carer.first_login_completed;
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Team Members</h3>
            <p className="text-gray-600">Manage your care team members</p>
          </div>
          <Button disabled className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Team Members</h3>
          <p className="text-gray-600">Manage your care team members</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Status Stats */}
      <StatusFilterStats carers={carers} currentFilter={statusFilter} />

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search staff by name, email, or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <CarerFilters
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          specializationFilter={specializationFilter}
          onSpecializationFilterChange={setSpecializationFilter}
          carers={carers}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={paginatedCarers.length > 0 && paginatedCarers.every(carer => isCarerSelected(carer))}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">Specialization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Auth Account</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCarers.map((carer) => (
              <TableRow key={carer.id}>
                <TableCell>
                  <Checkbox
                    checked={isCarerSelected(carer)}
                    onCheckedChange={(checked) => handleCarerSelection(carer, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{carer.first_name} {carer.last_name}</div>
                    <div className="text-sm text-gray-500 md:hidden">{carer.email}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{carer.email}</TableCell>
                <TableCell className="hidden lg:table-cell">{carer.phone}</TableCell>
                <TableCell className="hidden lg:table-cell">{carer.specialization}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(carer.status)}>
                    {carer.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {hasAuthAccount(carer) ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Set up
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(carer)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingCarer(carer)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedCarers([carer]);
                          setShowStatusChangeDialog(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Change Status
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSettingPasswordCarer(carer)}>
                        <Shield className="h-4 w-4 mr-2" />
                        Set Password
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeletingCarer(carer)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Empty State */}
        {filteredCarers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No staff found</div>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all" || specializationFilter !== "all"
                ? "Try adjusting your search criteria"
                : "Get started by adding your first staff member"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredCarers.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredCarers.length)} of {filteredCarers.length} staff
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCarers={selectedCarers}
        onClearSelection={() => setSelectedCarers([])}
        onBulkStatusChange={() => setShowStatusChangeDialog(true)}
      />

      {/* Dialogs */}
      <AddCarerDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        branchId={branchId}
      />

      <EditCarerDialog
        open={!!editingCarer}
        onOpenChange={(open) => !open && setEditingCarer(null)}
        carer={editingCarer}
      />

      <SetCarerPasswordDialog
        open={!!settingPasswordCarer}
        onOpenChange={(open) => !open && setSettingPasswordCarer(null)}
        carer={settingPasswordCarer}
      />

      <StatusChangeDialog
        open={showStatusChangeDialog}
        onOpenChange={setShowStatusChangeDialog}
        carers={selectedCarers}
        onStatusChange={handleBulkStatusChange}
      />

      <AlertDialog open={!!deletingCarer} onOpenChange={(open) => !open && setDeletingCarer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingCarer?.first_name} {deletingCarer?.last_name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
