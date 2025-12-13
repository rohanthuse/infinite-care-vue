import React, { useState } from "react";
import { format, differenceInMinutes } from "date-fns";
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  MoreVertical, 
  Eye, 
  ClipboardList, 
  Receipt,
  CheckCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppointmentExpensesList from "./AppointmentExpensesList";

interface PastAppointmentCardProps {
  appointment: any;
  onViewDetails: (appointment: any) => void;
  onCarePlanDetails: (clientId: string, clientName: string) => void;
  onAddExpense: (appointment: any) => void;
  formatAppointmentDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}

const formatDurationHoursMinutes = (totalMinutes: number): string => {
  if (totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const PastAppointmentCard: React.FC<PastAppointmentCardProps> = ({
  appointment,
  onViewDetails,
  onCarePlanDetails,
  onAddExpense,
  formatAppointmentDate,
  getStatusColor,
}) => {
  const clientName = `${appointment.clients?.first_name || ''} ${appointment.clients?.last_name || ''}`.trim();
  const clientId = appointment.client_id || appointment.clients?.id;
  
  // Calculate scheduled duration
  const scheduledDuration = Math.max(0, differenceInMinutes(
    new Date(appointment.end_time), 
    new Date(appointment.start_time)
  ));

  // Get actual visit times from visit_records
  const visitRecord = appointment.visit_records?.[0];
  const hasActualTimes = visitRecord?.visit_start_time;
  
  // Calculate actual duration
  const getActualDuration = () => {
    if (!visitRecord) return null;
    if (visitRecord.actual_duration_minutes && visitRecord.actual_duration_minutes > 0) {
      return visitRecord.actual_duration_minutes;
    }
    if (visitRecord.visit_start_time && visitRecord.visit_end_time) {
      let durationMins = differenceInMinutes(
        new Date(visitRecord.visit_end_time), 
        new Date(visitRecord.visit_start_time)
      );
      if (durationMins < 0) durationMins += 1440;
      return Math.max(0, durationMins);
    }
    return null;
  };

  const actualDuration = getActualDuration();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Section - Primary Info */}
          <div className="md:col-span-5 space-y-2">
            {/* Client Name */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{clientName || 'Unknown Client'}</span>
            </div>
            
            {/* Visit Date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatAppointmentDate(appointment.start_time)}
              </span>
            </div>
            
            {/* Scheduled Time */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
              </span>
              <Badge variant="outline" className="text-xs ml-1">
                {formatDurationHoursMinutes(scheduledDuration)}
              </Badge>
            </div>
            
            {/* Address */}
            {appointment.clients?.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate max-w-[200px]">
                  {appointment.clients.address}
                </span>
              </div>
            )}
            
            {/* Service */}
            <div className="flex flex-wrap gap-1 mt-1">
              {appointment.service_names && appointment.service_names.length > 0 ? (
                appointment.service_names.slice(0, 2).map((name: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs bg-primary/10 text-primary">
                    {name}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {appointment.services?.title || 'N/A'}
                </Badge>
              )}
              {appointment.service_names && appointment.service_names.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{appointment.service_names.length - 2}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Middle Section - Visit Summary */}
          <div className="md:col-span-4 md:border-l md:border-r md:px-4 space-y-3">
            {hasActualTimes ? (
              <>
                {/* Actual Visit Time */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Actual Time
                  </div>
                  <div className="text-sm font-medium">
                    {format(new Date(visitRecord.visit_start_time), 'HH:mm')} - {' '}
                    {visitRecord.visit_end_time 
                      ? format(new Date(visitRecord.visit_end_time), 'HH:mm')
                      : 'In Progress'
                    }
                  </div>
                </div>
                
                {/* Duration */}
                {actualDuration !== null && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Duration</div>
                    <div className="text-sm font-medium text-primary">
                      {formatDurationHoursMinutes(actualDuration)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No actual times recorded
              </div>
            )}
            
            {/* Expenses Indicator - handled by AppointmentExpensesList */}
            <AppointmentExpensesList bookingId={appointment.id} />
          </div>
          
          {/* Right Section - Status & Actions */}
          <div className="md:col-span-3 flex flex-col items-end gap-2">
            {/* Status Badge */}
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status === 'assigned' ? 'Scheduled' : 
               appointment.status === 'done' ? 'Completed' : 
               appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Badge>
            
            {/* Revenue */}
            {appointment.revenue && (
              <div className="text-lg font-semibold text-foreground">
                £{appointment.revenue}
              </div>
            )}
            
            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <MoreVertical className="h-4 w-4" />
                  <span className="hidden sm:inline">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover">
                <DropdownMenuItem onClick={() => onViewDetails(appointment)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCarePlanDetails(clientId, clientName)}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Care Plan Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAddExpense(appointment)}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Add Expense
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PastAppointmentCard;
