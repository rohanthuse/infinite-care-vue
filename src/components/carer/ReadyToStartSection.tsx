import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, MapPin, Phone, Play, ClipboardList } from "lucide-react";

import { CarePlanDetailsDialog } from "@/components/care/CarePlanDetailsDialog";
import { format, differenceInMinutes } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { useBookingAttendance } from "@/hooks/useBookingAttendance";
import { useCarerContext } from "@/hooks/useCarerContext";
import { toast } from "sonner";

interface ReadyToStartAppointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  branch_id: string;
  client_id?: string;
  clients?: {
    id?: string;
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
  };
  services?: {
    title: string;
  };
}

interface ReadyToStartSectionProps {
  appointments: ReadyToStartAppointment[];
  isLoading?: boolean;
}

export const ReadyToStartSection: React.FC<ReadyToStartSectionProps> = ({ 
  appointments = [], 
  isLoading = false 
}) => {
  const navigate = useNavigate();
  const { createCarerPath } = useCarerNavigation();
  const { data: carerContext } = useCarerContext();
  const bookingAttendance = useBookingAttendance();
  
  const [showCarePlanDialog, setShowCarePlanDialog] = useState(false);
  const [selectedClientForCarePlan, setSelectedClientForCarePlan] = useState<{
    clientId: string;
    clientName: string;
  } | null>(null);

  const handleStartVisit = async (appointment: ReadyToStartAppointment) => {
    try {
      console.log('[ReadyToStartSection] Starting visit for appointment:', appointment);
      
      if (!appointment.id) {
        toast.error('Invalid appointment data');
        return;
      }

      if (!carerContext?.staffId) {
        toast.error('Carer not authenticated');
        return;
      }

      let branchId = appointment.branch_id;
      if (!branchId) {
        branchId = carerContext?.branchInfo?.id;
      }

      if (!branchId) {
        toast.error('Branch information not found');
        return;
      }

      toast.loading('Starting visit...', { id: 'start-visit' });

      await bookingAttendance.mutateAsync({
        bookingId: appointment.id,
        staffId: carerContext.staffId,
        branchId: branchId,
        action: 'start_visit',
        location: {
          latitude: 0,
          longitude: 0
        }
      });

      toast.dismiss('start-visit');
      navigate(createCarerPath(`/visit/${appointment.id}`));
    } catch (error) {
      console.error('[ReadyToStartSection] Error starting visit:', error);
      toast.dismiss('start-visit');
    }
  };

  const getTimeInfo = (appointment: ReadyToStartAppointment) => {
    const now = new Date();
    const startTime = new Date(appointment.start_time);
    const minutesDiff = differenceInMinutes(startTime, now);
    
    if (Math.abs(minutesDiff) <= 240) {
      if (minutesDiff > 0) {
        return (
          <div className="text-xs text-amber-600 font-medium">
            Starts in {minutesDiff} minutes
          </div>
        );
      } else if (minutesDiff < 0) {
        return (
          <div className="text-xs text-red-600 font-medium">
            Started {Math.abs(minutesDiff)} minutes ago
          </div>
        );
      } else {
        return (
          <div className="text-xs text-green-600 font-medium">
            Starting now
          </div>
        );
      }
    }
    
    return null;
  };

  if (appointments.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <h2 className="text-lg font-semibold text-green-700">Ready to Start</h2>
        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-0">{appointments.length}</Badge>
      </div>
      
      <div className="space-y-4">
        {appointments.map((appointment) => (
          <Card 
            key={appointment.id}
            className="hover:shadow-md transition-all border-green-200 bg-green-50/50"
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>
                        {format(new Date(appointment.start_time), 'HH:mm')} - 
                        {format(new Date(appointment.end_time), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium truncate">
                      {appointment.clients?.first_name} {appointment.clients?.last_name}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Service:</strong> {appointment.services?.title || 'N/A'}
                  </div>
                  
                  {appointment.clients?.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{appointment.clients.address}</span>
                    </div>
                  )}
                  
                  {appointment.clients?.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{appointment.clients.phone}</span>
                    </div>
                  )}
                  
                  {getTimeInfo(appointment)}
                </div>
                
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                  <Badge className="bg-green-100 text-green-700">
                    Ready to Start
                  </Badge>
                  
                  <Button 
                    variant="default"
                    size="sm" 
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 flex-1 sm:flex-none w-full sm:w-auto"
                    onClick={() => handleStartVisit(appointment)}
                    disabled={bookingAttendance.isPending}
                  >
                    <Play className="h-4 w-4" />
                    {bookingAttendance.isPending ? 'Starting...' : 'Start Visit'}
                  </Button>
                </div>
              </div>
              
              {/* Care Plan Preview */}
              {(appointment.client_id || appointment.clients?.id) && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      const clientId = appointment.client_id || appointment.clients?.id;
                      const clientName = `${appointment.clients?.first_name || ''} ${appointment.clients?.last_name || ''}`.trim();
                      if (clientId) {
                        setSelectedClientForCarePlan({ clientId, clientName });
                        setShowCarePlanDialog(true);
                      }
                    }}
                  >
                    <ClipboardList className="h-4 w-4" />
                    View Care Plan Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedClientForCarePlan && (
        <CarePlanDetailsDialog
          clientId={selectedClientForCarePlan.clientId}
          clientName={selectedClientForCarePlan.clientName}
          open={showCarePlanDialog}
          onOpenChange={setShowCarePlanDialog}
        />
      )}
    </div>
  );
};