import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { ClientRateSchedule, ServiceType, dayLabels } from '@/types/clientAccounting';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useDeleteClientRateSchedule } from '@/hooks/useClientAccounting';
import { EditRateScheduleDialog } from './EditRateScheduleDialog';
import { ViewRateScheduleDialog } from './ViewRateScheduleDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RateScheduleTableProps {
  rateSchedules: ClientRateSchedule[];
  clientId: string;
  branchId: string;
}

export const RateScheduleTable: React.FC<RateScheduleTableProps> = ({
  rateSchedules,
  clientId,
  branchId
}) => {
  const [selectedSchedule, setSelectedSchedule] = useState<ClientRateSchedule | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteSchedule = useDeleteClientRateSchedule();

  const handleView = (schedule: ClientRateSchedule) => {
    setSelectedSchedule(schedule);
    setShowViewDialog(true);
  };

  const handleEdit = (schedule: ClientRateSchedule) => {
    setSelectedSchedule(schedule);
    setShowEditDialog(true);
  };

  const handleDelete = (schedule: ClientRateSchedule) => {
    setSelectedSchedule(schedule);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedSchedule) {
      deleteSchedule.mutate(selectedSchedule.id);
      setShowDeleteDialog(false);
      setSelectedSchedule(null);
    }
  };

  const formatDays = (days: string[]) => {
    return days.map(day => dayLabels[day] || day).join(', ');
  };

  const getStatusBadge = (schedule: ClientRateSchedule) => {
    const today = new Date();
    const startDate = new Date(schedule.start_date);
    const endDate = schedule.end_date ? new Date(schedule.end_date) : null;

    if (!schedule.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (startDate > today) {
      return <Badge variant="outline">Pending</Badge>;
    }

    if (endDate && endDate < today) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Authority</TableHead>
            <TableHead>Rate Category</TableHead>
            <TableHead>Base Rate</TableHead>
            <TableHead>VAT</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Time Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rateSchedules.map((schedule) => (
            <TableRow key={schedule.id}>
              <TableCell>
                {schedule.service_type_codes && schedule.service_type_codes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {schedule.service_type_codes.slice(0, 2).map(code => (
                      <Badge key={code} variant="outline" className="text-xs">
                        {code}
                      </Badge>
                    ))}
                    {schedule.service_type_codes.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{schedule.service_type_codes.length - 2} more
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">All Services</span>
                )}
              </TableCell>
              <TableCell>{schedule.authority_type}</TableCell>
              <TableCell className="capitalize">{schedule.rate_category}</TableCell>
              <TableCell>{formatCurrency(schedule.base_rate)}</TableCell>
              <TableCell>
                <Badge variant={schedule.is_vatable ? "default" : "secondary"}>
                  {schedule.is_vatable ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[150px] truncate">
                {formatDays(schedule.days_covered)}
              </TableCell>
              <TableCell>
                {schedule.time_from} - {schedule.time_until}
              </TableCell>
              <TableCell>{getStatusBadge(schedule)}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(schedule)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(schedule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(schedule)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedSchedule && (
        <>
          <EditRateScheduleDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            schedule={selectedSchedule}
            clientId={clientId}
            branchId={branchId}
          />

          <ViewRateScheduleDialog
            open={showViewDialog}
            onOpenChange={setShowViewDialog}
            schedule={selectedSchedule}
          />
        </>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rate Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rate schedule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};