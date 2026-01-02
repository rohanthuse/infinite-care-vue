import React, { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ServiceActionData, SHIFT_OPTIONS } from '@/types/serviceAction';
import { ViewServiceActionDialog } from '@/components/care/dialogs/ViewServiceActionDialog';

const DAYS_OF_WEEK_SHORT: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

interface ServiceActionsTableProps {
  actions: ServiceActionData[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onToggleStatus: (index: number) => void;
  readOnly?: boolean;
}

export function ServiceActionsTable({
  actions,
  onEdit,
  onDelete,
  onToggleStatus,
  readOnly = false,
}: ServiceActionsTableProps) {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [viewingAction, setViewingAction] = useState<ServiceActionData | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleView = (index: number) => {
    setViewingAction(actions[index]);
    setViewDialogOpen(true);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return '—';
    }
  };

  const formatShiftOrTime = (action: ServiceActionData) => {
    if (action.schedule_type === 'shift') {
      const shifts = action.shift_times || [];
      if (shifts.length === 0) return '—';
      return shifts.map(s => SHIFT_OPTIONS.find(o => o.key === s)?.label || s).join(', ');
    } else {
      if (!action.start_time && !action.end_time) return '—';
      return `${action.start_time || '—'} - ${action.end_time || '—'}`;
    }
  };

  const formatDays = (days: string[]) => {
    if (!days || days.length === 0) return '—';
    if (days.length === 7) return 'All Days';
    return days.map(d => DAYS_OF_WEEK_SHORT[d] || d).join(', ');
  };

  const handleDeleteConfirm = () => {
    if (deleteIndex !== null) {
      onDelete(deleteIndex);
      setDeleteIndex(null);
    }
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="font-semibold">Start Date</TableHead>
              <TableHead className="font-semibold">End Date</TableHead>
              <TableHead className="font-semibold">Shift / Time</TableHead>
              <TableHead className="font-semibold">Days</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((action, index) => (
              <TableRow key={action.id || index}>
                <TableCell className="font-medium">{action.action_name || '—'}</TableCell>
                <TableCell>{formatDate(action.start_date)}</TableCell>
                <TableCell>{formatDate(action.end_date)}</TableCell>
                <TableCell>{formatShiftOrTime(action)}</TableCell>
                <TableCell>
                  <span className="text-sm">{formatDays(action.selected_days)}</span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="custom"
                    className={
                      action.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }
                  >
                    {action.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(index)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!readOnly && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleStatus(index)}
                          title={action.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {action.status === 'active' ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(index)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteIndex(index)}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ViewServiceActionDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        action={viewingAction}
      />

      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service action? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
