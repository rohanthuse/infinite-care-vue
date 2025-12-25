import React from "react";
import { format, differenceInMinutes } from "date-fns";
import { 
  Clock, 
  MoreVertical, 
  ClipboardList, 
  Receipt,
  CheckCircle2,
  ChevronRight,
  Timer
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppointmentExpensesList from "./AppointmentExpensesList";
import { useBookingExtraTime } from "@/hooks/useBookingExtraTime";

interface PastAppointmentCardProps {
  appointment: any;
  onViewDetails: (appointment: any) => void;
  onCarePlanDetails: (clientId: string, clientName: string) => void;
  onAddExpense: (appointment: any) => void;
  onAddExtraTime?: (appointment: any) => void;
  formatAppointmentDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}

const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const PastAppointmentCard: React.FC<PastAppointmentCardProps> = ({
  appointment,
  onViewDetails,
  onCarePlanDetails,
  onAddExpense,
  onAddExtraTime,
  formatAppointmentDate,
}) => {
  const clientName = `${appointment.clients?.first_name || ''} ${appointment.clients?.last_name || ''}`.trim() || 'Unknown Client';
  const clientId = appointment.client_id || appointment.clients?.id;
  
  // Check for existing extra time claim for this booking
  const { data: existingExtraTime, isLoading: isLoadingExtraTime } = useBookingExtraTime(appointment.id);
  
  // Time calculations
  const scheduledStart = format(new Date(appointment.start_time), 'HH:mm');
  const scheduledEnd = format(new Date(appointment.end_time), 'HH:mm');
  const scheduledDuration = Math.max(0, differenceInMinutes(
    new Date(appointment.end_time), 
    new Date(appointment.start_time)
  ));

  // Actual visit times
  const visitRecord = appointment.visit_records?.[0];
  const hasActualTimes = visitRecord?.visit_start_time && visitRecord?.visit_end_time;
  
  let actualStart = '';
  let actualEnd = '';
  let actualDuration = 0;
  let calculatedExtraTime = 0;
  
  if (hasActualTimes) {
    actualStart = format(new Date(visitRecord.visit_start_time), 'HH:mm');
    actualEnd = format(new Date(visitRecord.visit_end_time), 'HH:mm');
    actualDuration = visitRecord.actual_duration_minutes || 
      Math.max(0, differenceInMinutes(new Date(visitRecord.visit_end_time), new Date(visitRecord.visit_start_time)));
    
    // Calculate extra time based on DURATION difference (not clock times)
    // Extra Time = max(Actual Duration - Scheduled Duration, 0)
    calculatedExtraTime = Math.max(0, actualDuration - scheduledDuration);
  }

  // Status
  const isCompleted = appointment.status === 'done' || appointment.status === 'completed';
  const isMissed = appointment.status === 'missed';
  
  // Can add extra time only if completed, has actual times, and extra time exists
  const canAddExtraTime = isCompleted && hasActualTimes && calculatedExtraTime > 0 && !existingExtraTime && onAddExtraTime;
  
  // Extra time status badge
  const getExtraTimeStatusBadge = () => {
    if (!existingExtraTime) return null;
    
    const statusConfig: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700', label: '🟡 Extra Time: Pending' },
      approved: { className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700', label: '✅ Extra Time: Approved' },
      rejected: { className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700', label: '❌ Extra Time: Rejected' },
    };
    
    const config = statusConfig[existingExtraTime.status] || statusConfig.pending;
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="hover:border-primary/20 transition-colors">
      <CardContent className="p-0">
        {/* Top Row - Primary Info */}
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">
              {clientName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatAppointmentDate(appointment.start_time)}
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge 
              variant="secondary"
              className={
                isCompleted 
                  ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' 
                  : isMissed 
                    ? 'bg-destructive/10 text-destructive dark:bg-destructive/20' 
                    : appointment.status === 'in_progress'
                      ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700'
                      : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
              }
            >
              {isCompleted ? 'Completed' : isMissed ? 'Missed' : appointment.status || 'Unknown'}
            </Badge>
            
            <DropdownMenu 
              modal={false}
              onOpenChange={(open) => {
                if (!open) {
                  // Ensure cleanup when menu closes
                  requestAnimationFrame(() => {
                    document.body.style.removeProperty('pointer-events');
                    document.documentElement.style.removeProperty('pointer-events');
                  });
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => onCarePlanDetails(clientId, clientName)}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Care Plan Details
                </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddExpense(appointment)}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Add Expense
                </DropdownMenuItem>
                {canAddExtraTime && (
                  <DropdownMenuItem onClick={() => onAddExtraTime(appointment)}>
                    <Timer className="h-4 w-4 mr-2" />
                    Add Extra Time
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Middle Row - Time Info */}
        <div className="px-4 py-3 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{scheduledStart} - {scheduledEnd}</span>
              <span className="text-xs opacity-70">({formatDuration(scheduledDuration)})</span>
            </div>
            
            {hasActualTimes && (
              <>
                <span className="text-muted-foreground/40">→</span>
                <div className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{actualStart} - {actualEnd}</span>
                  <span className="text-xs opacity-70">({formatDuration(actualDuration)})</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Extra Time Status Badge */}
        {existingExtraTime && (
          <div className="px-4 py-2 border-t border-border/50">
            {getExtraTimeStatusBadge()}
          </div>
        )}

        {/* Bottom Row - Expenses & Action */}
        <div className="px-4 py-3 border-t border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <AppointmentExpensesList bookingId={appointment.id} />
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewDetails(appointment)}
              className="flex-shrink-0 gap-1"
            >
              View Details
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PastAppointmentCard;
