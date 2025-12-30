
import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin, Plus, User, Edit, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewBookingDialog } from "@/components/bookings/dialogs/NewBookingDialog";
import { EditBookingDialog } from "@/components/bookings/dialogs/EditBookingDialog";
import { ViewBookingDialog } from "@/components/bookings/dialogs/ViewBookingDialog";
import { useClientBookings } from "@/hooks/useClientBookings";
import { useBranchCarers } from "@/data/hooks/useBranchCarers";
import { useBranchServices } from "@/data/hooks/useBranchServices";
import { useCreateMultipleBookings } from "@/data/hooks/useCreateMultipleBookings";
import { CreateBookingInput } from "@/data/hooks/useCreateBooking";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useBookingNavigation } from "@/hooks/useBookingNavigation";
import { useTenant } from "@/contexts/TenantContext";

interface AppointmentsTabProps {
  clientId: string;
  clientName?: string;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ clientId, clientName }) => {
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewBooking, setViewBooking] = useState<any>(null);
  
  const { data: bookings = [], isLoading, refetch } = useClientBookings(clientId);
  const params = useParams();
  const branchId = params.id || '';
  const branchName = params.branchName;
  const queryClient = useQueryClient();
  const { navigateToBookings } = useBookingNavigation();
  const { organization } = useTenant();
  
  // Get carers and services for the booking dialog
  const { data: carers = [] } = useBranchCarers(branchId);
  const { data: services = [] } = useBranchServices(branchId, organization?.id);
  
  // Use batch booking creation mutation for consolidated notifications
  const createMultipleBookingsMutation = useCreateMultipleBookings(branchId);

  const handleScheduleAppointment = () => {
    setIsScheduleDialogOpen(true);
  };

  const handleEditAppointment = (booking: any) => {
    // Transform booking to match EditBookingDialog's expected structure
    const transformedBooking = {
      ...booking,
      carerId: booking.staff_id,  // Map staff_id to carerId
      clientId: booking.client_id, // Map client_id to clientId
      carerName: booking.staff_name, // Already available from useClientBookings
    };
    setSelectedBooking(transformedBooking);
    setIsEditDialogOpen(true);
  };

  const handleViewAppointment = (booking: any) => {
    console.log('[AppointmentsTab] View appointment clicked:', booking);
    
    if (!booking || !booking.id) {
      console.error('[AppointmentsTab] Invalid booking data');
      toast.error('Unable to view appointment - invalid data');
      return;
    }
    
    const transformedBooking = {
      ...booking,
      carerId: booking.staff_id,
      clientId: booking.client_id,
      carerName: booking.staff_name,
    };
    
    console.log('[AppointmentsTab] Opening view dialog with:', transformedBooking);
    setViewBooking(transformedBooking);
    setIsViewDialogOpen(true);
  };

  const handleCreateBooking = async (bookingData: any, selectedCarers: any[]) => {
    console.log('[handleCreateBooking] Booking data received:', bookingData);
    console.log('[handleCreateBooking] Client from URL params:', clientId);

    // CRITICAL: Always use the client from the appointments tab (clientId from props)
    const actualClientId = clientId;

    if (!actualClientId) {
      toast.error("Client ID is required");
      return;
    }

    try {
      // Get client data to use their actual branch_id
      const clientResponse = await supabase
        .from('clients')
        .select('id, first_name, last_name, branch_id')
        .eq('id', actualClientId)
        .single();

      if (clientResponse.error) {
        console.error('[handleCreateBooking] Error fetching client:', clientResponse.error);
        toast.error("Failed to fetch client data");
        return;
      }

      const client = clientResponse.data;
      console.log('[handleCreateBooking] Using client data:', client);

      // Collect all bookings into an array first (batch approach)
      const bookingsToCreate: CreateBookingInput[] = [];
      
      // Create bookings for each schedule and each day within the date range
      for (const schedule of bookingData.schedules) {
        const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        const selectedDays = days.filter(day => schedule[day]);
        
        if (selectedDays.length === 0) {
          console.warn('[handleCreateBooking] No days selected for schedule');
          continue;
        }

        // Expand bookings across the full date range
        const startDate = new Date(bookingData.fromDate);
        const endDate = new Date(bookingData.untilDate);
        
        console.log('[handleCreateBooking] Date range:', { startDate, endDate });

        for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
          const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][currentDate.getDay()];
          
          if (selectedDays.includes(dayOfWeek)) {
            // Create booking for this day
            const bookingStartTime = new Date(currentDate);
            const bookingEndTime = new Date(currentDate);
            
            // Set the time based on schedule
            const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
            const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
            
            bookingStartTime.setHours(startHour, startMinute, 0, 0);
            bookingEndTime.setHours(endHour, endMinute, 0, 0);

            // Skip if no services are selected (should be prevented by validation)
            if (!schedule.services || schedule.services.length === 0) {
              console.warn('[handleCreateBooking] No services selected for schedule, skipping');
              continue;
            }

            // Collect a separate booking for EACH selected service
            for (const serviceId of schedule.services) {
              bookingsToCreate.push({
                branch_id: client.branch_id,
                client_id: actualClientId,
                staff_id: bookingData.carerId || undefined,
                start_time: bookingStartTime.toISOString(),
                end_time: bookingEndTime.toISOString(),
                service_id: serviceId,
                notes: bookingData.notes || null,
              });
            }
          }
        }
      }

      // If no bookings to create, show error
      if (bookingsToCreate.length === 0) {
        toast.error("No bookings to create. Please check your schedule configuration.");
        return;
      }

      console.log('[handleCreateBooking] Creating', bookingsToCreate.length, 'bookings in batch');

      // Create all bookings in a single batch call
      const result = await createMultipleBookingsMutation.mutateAsync(bookingsToCreate);
      const createdBookings = result?.bookings || [];
      
      // Calculate date range for consolidated notification
      const hasCarerAssigned = Boolean(bookingData.carerId);
      const actualCount = createdBookings.length || bookingsToCreate.length;
      
      let dateRangeText = '';
      if (createdBookings.length > 0) {
        const dates = createdBookings
          .map((b: any) => new Date(b.start_time))
          .sort((a: Date, b: Date) => a.getTime() - b.getTime());
        const firstDate = format(dates[0], 'dd MMM yyyy');
        const lastDate = format(dates[dates.length - 1], 'dd MMM yyyy');
        dateRangeText = firstDate === lastDate ? firstDate : `${firstDate} to ${lastDate}`;
      }

      // Build consolidated summary
      const summaryParts: string[] = [];
      summaryParts.push(`${actualCount} appointment${actualCount > 1 ? 's' : ''} added`);
      if (dateRangeText) {
        summaryParts.push(dateRangeText);
      }

      // Show SINGLE consolidated toast notification
      if (hasCarerAssigned) {
        toast.success("Recurring Booking Created Successfully!", {
          description: summaryParts.join(' • '),
          duration: 5000
        });
      } else {
        toast.success("Recurring booking series created without assigned carers", {
          description: summaryParts.join(' • '),
          duration: 5000
        });
      }
      
      // Refresh bookings for this client
      refetch();
      
      // Also invalidate branch bookings cache so it shows up in the calendar
      queryClient.invalidateQueries({ queryKey: ["branch-bookings", client.branch_id] });
      queryClient.invalidateQueries({ queryKey: ["client-bookings", actualClientId] });
      queryClient.invalidateQueries({ queryKey: ["organization-calendar"] });
      
      // Navigate to bookings tab with the first created booking highlighted
      const firstCreatedBooking = createdBookings?.[0];
      if (firstCreatedBooking && branchId && branchName) {
        const bookingDate = new Date(firstCreatedBooking.start_time);
        navigateToBookings({
          branchId,
          branchName: decodeURIComponent(branchName),
          date: bookingDate,
          clientId: actualClientId
        });
        
        // Add focus parameter to highlight the booking
        setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          params.set('focusBookingId', firstCreatedBooking.id);
          window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        }, 100);
      }
      
      console.log('[handleCreateBooking] Batch booking creation completed');
    } catch (error) {
      console.error("Error creating bookings:", error);
      toast.error("Failed to create bookings");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'assigned':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getAppointmentStatus = (booking: any) => {
    const now = new Date();
    const startTime = parseISO(booking.start_time);
    const endTime = parseISO(booking.end_time);

    if (now > endTime) {
      return 'completed';
    } else if (now >= startTime) {
      return 'in-progress';
    } else {
      return booking.status || 'confirmed';
    }
  };

  const canEditAppointment = (booking: any) => {
    const now = new Date();
    const startTime = parseISO(booking.start_time);
    return now < startTime; // Can only edit if appointment hasn't started
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Appointments</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={handleScheduleAppointment}>
              <Plus className="h-4 w-4" />
              <span>Schedule</span>
            </Button>
          </div>
          <CardDescription>Scheduled appointments{clientName ? ` for ${clientName}` : ''}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">No appointments scheduled for this client</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const startDate = parseISO(booking.start_time);
                const endDate = parseISO(booking.end_time);
                const currentStatus = getAppointmentStatus(booking);
                const canEdit = canEditAppointment(booking);
                
                return (
                  <div 
                    key={booking.id} 
                    className="border rounded-lg p-4 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{booking.service_name || 'Service Not Selected'}</h3>
                          <Badge variant="outline" className={getStatusColor(currentStatus)}>
                            {currentStatus === 'in-progress' ? 'In Progress' : 
                             currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(startDate, 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{booking.staff_name || 'Staff Not Assigned'}</span>
                          </div>
                          {booking.revenue && (
                            <div className="flex items-center gap-1">
                              <span>Revenue: £{booking.revenue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewAppointment(booking);
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAppointment(booking);
                            }}
                            title="Edit Booking"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <NewBookingDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        onCreateBooking={handleCreateBooking}
        carers={carers}
        services={services}
        branchId={branchId}
        preSelectedClientId={clientId}
        isCreating={createMultipleBookingsMutation.isPending}
      />

      <EditBookingDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        booking={selectedBooking}
        services={services}
        branchId={branchId}
        carers={carers.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}` }))}
      />

      <ViewBookingDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        booking={viewBooking}
        services={services}
        branchId={branchId}
        onEdit={() => {
          setIsViewDialogOpen(false);
          setTimeout(() => {
            if (viewBooking) {
              handleEditAppointment(viewBooking);
            }
          }, 100);
        }}
      />
    </div>
  );
};
