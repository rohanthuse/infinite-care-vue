import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ViewServiceActionDialog } from '@/components/care/dialogs/ViewServiceActionDialog';
import { ServiceActionData } from '@/types/serviceAction';

interface ServiceActionsSectionProps {
  serviceActions: any[];
}

const SHIFT_OPTIONS: Record<string, string> = {
  am: 'AM',
  lunch: 'Lunch',
  pm: 'PM',
  night: 'Night',
};

const DAYS_OF_WEEK_SHORT: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export function ServiceActionsSection({ serviceActions }: ServiceActionsSectionProps) {
  const actions = serviceActions || [];
  const [viewingAction, setViewingAction] = useState<ServiceActionData | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleView = (action: any) => {
    setViewingAction(action as ServiceActionData);
    setViewDialogOpen(true);
  };

  const formatDate = (date: any) => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return '—';
    }
  };

  const formatShiftOrTime = (action: any) => {
    if (action.schedule_type === 'shift') {
      const shifts = action.shift_times || [];
      if (shifts.length === 0) return '—';
      return shifts.map((s: string) => SHIFT_OPTIONS[s] || s).join(', ');
    } else if (action.schedule_type === 'time_specific') {
      if (!action.start_time && !action.end_time) return '—';
      return `${action.start_time || '—'} - ${action.end_time || '—'}`;
    }
    // Fallback for old format
    if (action.schedule_details) return action.schedule_details;
    return '—';
  };

  const formatDays = (days: string[]) => {
    if (!days || days.length === 0) return '—';
    if (days.length === 7) return 'All Days';
    return days.map(d => DAYS_OF_WEEK_SHORT[d] || d).join(', ');
  };

  const getActionName = (action: any) => {
    return action.action_name || action.service_name || action.name || '—';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Service Actions ({actions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No service actions have been recorded yet.</p>
              <p className="text-sm">Service actions can be added during care plan creation.</p>
            </div>
          ) : (
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
                      <TableCell className="font-medium">{getActionName(action)}</TableCell>
                      <TableCell>{formatDate(action.start_date)}</TableCell>
                      <TableCell>{formatDate(action.end_date)}</TableCell>
                      <TableCell>{formatShiftOrTime(action)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDays(action.selected_days)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="custom"
                          className={action.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}
                        >
                          {action.status === 'active' ? 'Active' : action.status === 'inactive' ? 'Inactive' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(action)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ViewServiceActionDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        action={viewingAction}
      />
    </div>
  );
}
