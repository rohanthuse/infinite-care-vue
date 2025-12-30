import React from "react";
import { format } from "date-fns";
import { Settings, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientServiceAction } from "@/hooks/useClientServiceActions";

interface ServiceActionsTabProps {
  serviceActions: ClientServiceAction[] | any[];
  onAddServiceAction?: () => void;
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

export const ServiceActionsTab: React.FC<ServiceActionsTabProps> = ({ 
  serviceActions, 
  onAddServiceAction 
}) => {
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
    if (action.duration) return action.duration;
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

  const getStatus = (action: any) => {
    if (action.status === 'active' || action.progress_status === 'active') return 'active';
    if (action.status === 'inactive' || action.progress_status === 'completed') return 'inactive';
    return action.status || action.progress_status || 'unknown';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Service Actions</CardTitle>
            </div>
            {onAddServiceAction && (
              <Button size="sm" className="gap-1" onClick={onAddServiceAction}>
                <Plus className="h-4 w-4" />
                <span>Add Service Action</span>
              </Button>
            )}
          </div>
          <CardDescription>Individual service actions and interventions</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {serviceActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm">No service actions available</p>
              {onAddServiceAction && (
                <Button variant="outline" className="mt-3" onClick={onAddServiceAction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Service Action
                </Button>
              )}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                {serviceActions.map((action, index) => {
                    const status = getStatus(action);
                    const isFromCarePlan = action.care_plan_id || action.source === 'care_plan';
                    return (
                      <TableRow key={action.id || index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getActionName(action)}
                            {isFromCarePlan && (
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                From Care Plan
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(action.start_date)}</TableCell>
                        <TableCell>{formatDate(action.end_date)}</TableCell>
                        <TableCell>{formatShiftOrTime(action)}</TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDays(action.selected_days)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={status === 'active' ? 'default' : 'secondary'}
                            className={status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                          >
                            {status === 'active' ? 'Active' : status === 'inactive' ? 'Inactive' : status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
