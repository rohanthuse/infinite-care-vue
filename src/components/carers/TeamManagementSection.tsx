
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Shield, UserCheck, Eye, Settings, Mail, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AddCarerDialog } from "./AddCarerDialog";
import { EditCarerDialog } from "./EditCarerDialog";
import { ViewFullCarerProfileDialog } from "./ViewFullCarerProfileDialog";
import { SetCarerPasswordDialog } from "./SetCarerPasswordDialog";
import { StatusChangeDialog } from "./StatusChangeDialog";
import { BulkActionsBar } from "./BulkActionsBar";
import { SendInvitationDialog } from "./SendInvitationDialog";
import { TransferBranchDialog } from "./TransferBranchDialog";
import { useSendInvitationEmail } from "@/hooks/useSendInvitationEmail";
import { StatusFilterStats } from "./StatusFilterStats";
import { CarerFilters } from "./CarerFilters";
import { format } from "date-fns";

import { useBranchCarers, CarerDB, useDeleteCarer, useUpdateCarer } from "@/data/hooks/useBranchCarers";
import { useDialogManager } from "@/hooks/useDialogManager";
import { useQueryClient } from "@tanstack/react-query";
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

// Helper to extract postcode/PIN code from address string
const extractPostcodeFromAddress = (address: string | undefined): string => {
  if (!address) return '';
  
  // Try UK postcode pattern first (e.g., SW1A 1AA, M1 1AE, AL10 9HX)
  const ukPostcodeRegex = /\b([A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2})\b/i;
  const ukMatch = address.match(ukPostcodeRegex);
  if (ukMatch) return ukMatch[1].toUpperCase();
  
  // Try Indian PIN code pattern (6 digits)
  const indianPinRegex = /\b(\d{6})\b/;
  const indianMatch = address.match(indianPinRegex);
  if (indianMatch) return indianMatch[1];
  
  // Try 5-digit codes (US ZIP, other formats)
  const fiveDigitRegex = /\b(\d{5})\b/;
  const fiveDigitMatch = address.match(fiveDigitRegex);
  if (fiveDigitMatch) return fiveDigitMatch[1];
  
  // Fallback: Try to extract last comma-separated part if it looks like a code
  const parts = address.split(',').map(p => p.trim());
  const lastPart = parts[parts.length - 1];
  
  // Check if last part is alphanumeric and reasonable length (3-10 chars)
  if (lastPart && /^[A-Z0-9\s]{3,10}$/i.test(lastPart)) {
    return lastPart.toUpperCase();
  }
  
  return '';
};

interface TeamManagementSectionProps {
  branchId: string;
  branchName?: string;
  selectedStaffId?: string | null;
}

const ITEMS_PER_PAGE = 10;

export function TeamManagementSection({ branchId, branchName, selectedStaffId }: TeamManagementSectionProps) {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();
  const { closeAllDropdowns } = useDialogManager();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCarer, setEditingCarer] = useState<CarerDB | null>(null);
  const [viewingFullProfile, setViewingFullProfile] = useState<{ carerId: string } | null>(null);
  const [settingPasswordCarer, setSettingPasswordCarer] = useState<CarerDB | null>(null);
  const [sendingInvitationCarer, setSendingInvitationCarer] = useState<CarerDB | null>(null);
  const [deletingCarer, setDeletingCarer] = useState<CarerDB | null>(null);
  const [selectedCarers, setSelectedCarers] = useState<CarerDB[]>([]);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [transferringCarer, setTransferringCarer] = useState<CarerDB | null>(null);
  
  // Refs for preventing race conditions and memory leaks
  const dialogCleanupRef = useRef<NodeJS.Timeout>();
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const isUnmountedRef = useRef(false);

  const { data: carers = [], isLoading } = useBranchCarers(branchId);
  const deleteMutation = useDeleteCarer();
  const updateCarerMutation = useUpdateCarer();
  const sendInvitationMutation = useSendInvitationEmail();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (dialogCleanupRef.current) {
        clearTimeout(dialogCleanupRef.current);
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Auto-open profile dialog when selectedStaffId is passed from search
  useEffect(() => {
    if (selectedStaffId && !isLoading) {
      console.log('[TeamManagementSection] Auto-opening profile for staff:', selectedStaffId);
      setViewingFullProfile({ carerId: selectedStaffId });
    }
  }, [selectedStaffId, isLoading]);

  // Global cleanup safeguard - remove stuck overlays when dialogs close
  useEffect(() => {
    // Cleanup function to remove any stuck overlays
    const cleanupStuckOverlays = () => {
      // Check if there are any dialog overlays but no open dialogs
      const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-alert-dialog-overlay]');
      const openDialogs = document.querySelectorAll('[data-radix-dialog-content][data-state="open"], [data-radix-alert-dialog-content][data-state="open"]');
      
      if (overlays.length > 0 && openDialogs.length === 0) {
        console.log('Cleaning up stuck overlays...');
        overlays.forEach(overlay => overlay.remove());
        
        // Remove aria-hidden and inert from any elements
        document.querySelectorAll('[aria-hidden="true"], [inert]').forEach(el => {
          el.removeAttribute('aria-hidden');
          el.removeAttribute('inert');
        });
        
        // Aggressive body/html cleanup
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('pointer-events');
        document.documentElement.style.removeProperty('overflow');
        document.body.classList.remove('overflow-hidden');
        document.documentElement.classList.remove('overflow-hidden');
        document.body.removeAttribute('data-scroll-locked');
        document.documentElement.removeAttribute('data-scroll-locked');
      }
    };

    // Run cleanup check after state changes
    const timeoutId = setTimeout(cleanupStuckOverlays, 500);
    
    return () => clearTimeout(timeoutId);
  }, [editingCarer, viewingFullProfile, settingPasswordCarer, deletingCarer, showStatusChangeDialog]);


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

  const handleSendInvitation = useCallback(async () => {
    if (!sendingInvitationCarer) return;
    
    try {
      await sendInvitationMutation.mutateAsync({
        staffId: sendingInvitationCarer.id,
        email: sendingInvitationCarer.email || '',
        firstName: sendingInvitationCarer.first_name,
        lastName: sendingInvitationCarer.last_name
      });
      setSendingInvitationCarer(null);
    } catch (error) {
      // Error handled by mutation
    }
  }, [sendingInvitationCarer, sendInvitationMutation]);

  const handleBulkStatusChange = useCallback(async (carerIds: string[], newStatus: string, reason?: string) => {
    if (isUnmountedRef.current) return;
    
    try {
      // Update each carer's status with timeout protection
      const promises = carerIds.map(carerId => 
        Promise.race([
          updateCarerMutation.mutateAsync({
            id: carerId,
            status: newStatus
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Update timeout')), 10000)
          )
        ])
      );
      
      const results = await Promise.allSettled(promises);
      
      // Check for failures
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (!isUnmountedRef.current) {
        if (failed > 0 && succeeded === 0) {
          // All failed
          const failedResult = results.find(r => r.status === 'rejected') as PromiseRejectedResult;
          toast.error("Failed to update status", {
            description: failedResult?.reason?.message || "Please check your permissions and try again."
          });
        } else if (failed > 0) {
          // Some failed
          toast.warning(`Status updated for ${succeeded} staff member${succeeded > 1 ? 's' : ''}, ${failed} failed`, {
            description: "Some updates may have failed. Please refresh the page to verify."
          });
        } else if (succeeded > 0) {
          // All succeeded
          toast.success(`Status updated for ${succeeded} staff member${succeeded > 1 ? 's' : ''}`, {
            description: reason ? `Reason: ${reason}` : undefined
          });
        }
        
        // Force immediate refetch of staff list
        await queryClient.invalidateQueries({ 
          queryKey: ["branch-carers", branchId],
          refetchType: 'all'
        });
        
        // Clear selection with delay to prevent race conditions
        updateTimeoutRef.current = setTimeout(() => {
          if (!isUnmountedRef.current) {
            setSelectedCarers([]);
          }
        }, 100);
      }
    } catch (error: any) {
      if (!isUnmountedRef.current) {
        console.error('[handleBulkStatusChange] Error:', error);
        toast.error("Failed to update status", {
          description: error?.message || "An unexpected error occurred."
        });
      }
    }
  }, [updateCarerMutation, branchId, queryClient]);

  const handleCarerSelection = useCallback((carer: CarerDB, checked: boolean) => {
    if (isUnmountedRef.current) return;
    
    setSelectedCarers(prev => {
      if (checked) {
        return prev.some(c => c.id === carer.id) ? prev : [...prev, carer];
      } else {
        return prev.filter(c => c.id !== carer.id);
      }
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (isUnmountedRef.current) return;
    
    if (checked) {
      setSelectedCarers(paginatedCarers);
    } else {
      setSelectedCarers([]);
    }
  }, [paginatedCarers]);

  const isCarerSelected = (carer: CarerDB) => {
    return selectedCarers.some(c => c.id === carer.id);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
      case 'pending invitation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
      case 'on leave':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700';
      case 'training':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
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
            <h3 className="text-xl font-semibold text-foreground">Team Members</h3>
            <p className="text-muted-foreground">Manage your care team members</p>
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
          <h3 className="text-xl font-semibold text-foreground">Team Members</h3>
          <p className="text-muted-foreground">Manage your care team members</p>
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
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-x-auto">
        <div className="text-xs text-muted-foreground mb-2 px-1">← Scroll horizontally to see all columns</div>
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={paginatedCarers.length > 0 && paginatedCarers.every(carer => isCarerSelected(carer))}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="whitespace-nowrap">Name</TableHead>
              <TableHead className="hidden md:table-cell whitespace-nowrap">Email</TableHead>
              <TableHead className="hidden lg:table-cell whitespace-nowrap">Phone</TableHead>
              <TableHead className="hidden lg:table-cell whitespace-nowrap">Postcode</TableHead>
              <TableHead className="hidden lg:table-cell whitespace-nowrap">Specialization</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="hidden md:table-cell whitespace-nowrap">Registered</TableHead>
              <TableHead className="w-[70px] table-actions-column">Actions</TableHead>
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
                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {extractPostcodeFromAddress(carer.address) || 'Postcode not available'}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{carer.specialization}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(carer.status)}>
                      {carer.status}
                    </Badge>
                  {carer.invitation_sent_at && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700">
                        Invited
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-gray-600">
                    {carer.created_at 
                      ? format(new Date(carer.created_at), 'dd MMM yyyy')
                      : '-'}
                  </span>
                </TableCell>
                <TableCell className="table-actions-column">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        closeAllDropdowns();
                        setTimeout(() => setViewingFullProfile({ carerId: carer.id }), 100);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        closeAllDropdowns();
                        setTimeout(() => setEditingCarer(carer), 50);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          closeAllDropdowns();
                          setTimeout(() => {
                            setSelectedCarers([carer]);
                            setShowStatusChangeDialog(true);
                          }, 50);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Change Status
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        closeAllDropdowns();
                        setTimeout(() => setSendingInvitationCarer(carer), 50);
                      }}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        closeAllDropdowns();
                        setTimeout(() => setTransferringCarer(carer), 50);
                      }}>
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Transfer to Another Branch
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        closeAllDropdowns();
                        setTimeout(() => setSettingPasswordCarer(carer), 50);
                      }}>
                        <Shield className="h-4 w-4 mr-2" />
                        Set Password
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          closeAllDropdowns();
                          setTimeout(() => setDeletingCarer(carer), 50);
                        }}
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

      {viewingFullProfile && (
        <ViewFullCarerProfileDialog
          carerId={viewingFullProfile.carerId}
          branchId={branchId}
          branchName={branchName}
          isOpen={!!viewingFullProfile}
          onClose={() => setViewingFullProfile(null)}
        />
      )}

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

      <SendInvitationDialog
        open={!!sendingInvitationCarer}
        onOpenChange={(open) => {
          if (!open) setSendingInvitationCarer(null);
        }}
        carer={sendingInvitationCarer}
        onConfirm={handleSendInvitation}
        isLoading={sendInvitationMutation.isPending}
      />

      {transferringCarer && (
        <TransferBranchDialog
          open={!!transferringCarer}
          onOpenChange={(open) => !open && setTransferringCarer(null)}
          staff={transferringCarer}
          currentBranchName={branchName || 'Current Branch'}
          onTransferComplete={() => setTransferringCarer(null)}
        />
      )}

      <AlertDialog open={!!deletingCarer} onOpenChange={(open) => !open && setDeletingCarer(null)}>
        <AlertDialogContent onCloseAutoFocus={() => {
          // Comprehensive cleanup on close
          setTimeout(() => {
            // Remove any stuck overlays
            const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-alert-dialog-overlay]');
            overlays.forEach(overlay => overlay.remove());
            
            // Remove aria-hidden and inert from any elements
            document.querySelectorAll('[aria-hidden="true"], [inert]').forEach(el => {
              el.removeAttribute('aria-hidden');
              el.removeAttribute('inert');
            });
            
            // Aggressive body/html cleanup
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('pointer-events');
            document.documentElement.style.removeProperty('overflow');
            document.body.classList.remove('overflow-hidden');
            document.documentElement.classList.remove('overflow-hidden');
            document.body.removeAttribute('data-scroll-locked');
            document.documentElement.removeAttribute('data-scroll-locked');
          }, 50);
        }}>
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
