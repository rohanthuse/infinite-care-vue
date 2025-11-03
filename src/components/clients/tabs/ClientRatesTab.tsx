import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useClientRateSchedules, useDeleteClientRateSchedule } from "@/hooks/useClientAccounting";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AddRateScheduleDialog } from "@/components/clients/tabs/accounting/AddRateScheduleDialog";
import { EditRateScheduleDialog } from "@/components/clients/tabs/accounting/EditRateScheduleDialog";
import { ViewRateScheduleDialog } from "@/components/clients/tabs/accounting/ViewRateScheduleDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";
import { ClientRateSchedule } from "@/types/clientAccounting";
import { ServiceTypesDisplay } from '@/components/carer-profile/accounting/ServiceTypesDisplay';

interface ClientRatesTabProps {
  clientId: string;
  branchId: string;
}

export const ClientRatesTab: React.FC<ClientRatesTabProps> = ({ clientId, branchId }) => {
  const queryClient = useQueryClient();
  const [isAddRateDialogOpen, setIsAddRateDialogOpen] = useState(false);
  const [isEditRateDialogOpen, setIsEditRateDialogOpen] = useState(false);
  const [isViewRateDialogOpen, setIsViewRateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ClientRateSchedule | null>(null);

  const { data: rateSchedules = [], isLoading } = useClientRateSchedules(clientId);
  const deleteRateSchedule = useDeleteClientRateSchedule();

  console.log('[ClientRatesTab] Client-specific rate schedules:', rateSchedules.length);

  const handleViewRate = (schedule: ClientRateSchedule) => {
    setSelectedSchedule(schedule);
    setIsViewRateDialogOpen(true);
  };

  const handleEditRate = (schedule: ClientRateSchedule) => {
    setSelectedSchedule(schedule);
    setIsEditRateDialogOpen(true);
  };

  const handleDeleteRate = (schedule: ClientRateSchedule) => {
    setSelectedSchedule(schedule);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSchedule) {
      console.error('[ClientRatesTab] No schedule selected for deletion');
      return;
    }
    
    const scheduleId = selectedSchedule.id;
    if (!scheduleId) {
      console.error('[ClientRatesTab] Selected schedule has no ID:', selectedSchedule);
      toast.error('Cannot delete schedule: Invalid schedule ID');
      return;
    }
    
    console.log('[ClientRatesTab] Attempting to delete schedule:', scheduleId);
    
    try {
      await deleteRateSchedule.mutateAsync(scheduleId);
      
      // Optimistically update the UI by removing the deleted schedule from cache
      queryClient.setQueryData(['client-rate-schedules', clientId], (oldData: any) => {
        if (Array.isArray(oldData)) {
          return oldData.filter(r => r.id !== scheduleId);
        }
        return oldData;
      });
      
      console.log('[ClientRatesTab] Schedule deleted successfully:', scheduleId);
      setIsDeleteDialogOpen(false);
      setSelectedSchedule(null);
    } catch (error) {
      console.error('[ClientRatesTab] Error deleting schedule:', error);
      toast.error(`Failed to delete schedule: ${error.message || 'Unknown error'}`);
    }
  };

  const getStatusBadge = (isActive: boolean, startDate: string, endDate?: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (!isActive) {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
    if (now < start) {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
    if (end && now > end) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Ongoing";
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const formatDays = (days: string[]) => {
    if (!days || days.length === 0) return "None";
    if (days.length === 7) return "All Days";
    return days.join(", ");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Service Rate Schedules</CardTitle>
            <CardDescription>Manage rate schedules specific to this client</CardDescription>
          </div>
          <Button onClick={() => setIsAddRateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Rate Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rateSchedules.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No Rate Schedules</h3>
            <p className="text-muted-foreground">Start by adding a rate schedule for this client.</p>
            <Button 
              onClick={() => setIsAddRateDialogOpen(true)} 
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Rate Schedule
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Authority</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Base Rate</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Effective Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rateSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    <ServiceTypesDisplay 
                      serviceCodes={schedule.service_type_codes || []} 
                      maxVisible={2}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {schedule.authority_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {schedule.rate_category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(schedule.base_rate)}
                    {schedule.is_vatable && (
                      <span className="text-xs text-muted-foreground ml-1">(+VAT)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDays(schedule.days_covered)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {formatDate(schedule.start_date)} - {formatDate(schedule.end_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(schedule.is_active, schedule.start_date, schedule.end_date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewRate(schedule)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRate(schedule)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteRate(schedule);
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Dialogs */}
      <AddRateScheduleDialog
        open={isAddRateDialogOpen}
        onOpenChange={setIsAddRateDialogOpen}
        clientId={clientId}
        branchId={branchId}
      />

      {selectedSchedule && (
        <>
          <EditRateScheduleDialog
            open={isEditRateDialogOpen}
            onOpenChange={(open) => {
              setIsEditRateDialogOpen(open);
              if (!open) setSelectedSchedule(null);
            }}
            schedule={selectedSchedule}
            clientId={clientId}
            branchId={branchId}
          />

          <ViewRateScheduleDialog
            open={isViewRateDialogOpen}
            onOpenChange={(open) => {
              setIsViewRateDialogOpen(open);
              if (!open) setSelectedSchedule(null);
            }}
            schedule={selectedSchedule}
          />
        </>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rate Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this rate schedule? This action will mark it as inactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
