
import React, { useState, useMemo } from "react";
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Shield, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddCarerDialog } from "./AddCarerDialog";
import { EditCarerDialog } from "./EditCarerDialog";
import { SetCarerPasswordDialog } from "./SetCarerPasswordDialog";
import { CarerFilters } from "./CarerFilters";
import { useBranchCarers, CarerDB, useDeleteCarer } from "@/data/hooks/useBranchCarers";
import { useLocation } from "react-router-dom";
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

export function CarersTab() {
  const location = useLocation();
  const branchId = location.pathname.split('/')[2];
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCarer, setEditingCarer] = useState<CarerDB | null>(null);
  const [settingPasswordCarer, setSettingPasswordCarer] = useState<CarerDB | null>(null);
  const [deletingCarer, setDeletingCarer] = useState<CarerDB | null>(null);

  const { data: carers = [], isLoading } = useBranchCarers(branchId);
  const deleteMutation = useDeleteCarer();

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

  const handleDelete = async () => {
    if (!deletingCarer) return;
    
    try {
      await deleteMutation.mutateAsync(deletingCarer.id);
      setDeletingCarer(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending invitation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const hasAuthAccount = (carer: CarerDB) => {
    // Check if carer has completed invitation process or has been assigned a password
    return carer.invitation_accepted_at || carer.first_login_completed;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading carers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Carers</h2>
          <p className="text-gray-600">Manage your care team members</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Carer
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search carers by name, email, or specialization..."
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

      {/* Carers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCarers.map((carer) => (
          <Card key={carer.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {carer.first_name} {carer.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{carer.email}</p>
                  <p className="text-sm text-gray-600">{carer.phone}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingCarer(carer)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
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
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant="outline" className={getStatusColor(carer.status)}>
                    {carer.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Auth Account:</span>
                  <div className="flex items-center gap-1">
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
                  </div>
                </div>

                {carer.specialization && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Specialization:</span>
                    <span className="text-sm font-medium">{carer.specialization}</span>
                  </div>
                )}

                {carer.availability && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Availability:</span>
                    <span className="text-sm font-medium">{carer.availability}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCarers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No carers found</div>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all" || specializationFilter !== "all"
              ? "Try adjusting your search criteria"
              : "Get started by adding your first carer"}
          </p>
        </div>
      )}

      {/* Dialogs */}
      {showAddDialog && (
        <AddCarerDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog}
          branchId={branchId}
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

      <AlertDialog open={!!deletingCarer} onOpenChange={(open) => !open && setDeletingCarer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Carer</AlertDialogTitle>
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
