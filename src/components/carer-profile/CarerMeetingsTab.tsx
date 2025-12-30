import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, Video, Plus, MapPin, Briefcase, User } from "lucide-react";
import { NewMeetingDialog } from "@/components/organization-calendar/NewMeetingDialog";
import { useStaffMeetings } from "@/hooks/useStaffMeetings";
import { useCarerBookings } from "@/hooks/useCarerBookings";
import { format } from "date-fns";

interface CarerMeetingsTabProps {
  carerId: string;
  branchId?: string;
}

const getMeetingStatusBadgeClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'confirmed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const getBookingStatusBadgeClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'assigned':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'unassigned':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'done':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'suspended':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

export const CarerMeetingsTab: React.FC<CarerMeetingsTabProps> = ({ carerId, branchId }) => {
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const { data: meetings = [], isLoading: meetingsLoading } = useStaffMeetings(carerId);
  const { data: bookings = [], isLoading: bookingsLoading } = useCarerBookings(carerId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Meetings & Appointments
          </CardTitle>
          <Button size="sm" onClick={() => setMeetingDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="meetings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="meetings" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Meetings
              </TabsTrigger>
              <TabsTrigger value="appointments" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Appointments
              </TabsTrigger>
            </TabsList>

            {/* Meetings Sub-Tab */}
            <TabsContent value="meetings" className="space-y-3 mt-0">
              {meetingsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading meetings...
                </div>
              ) : meetings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No meetings scheduled yet. Click "Schedule Meeting" to add one.
                </div>
              ) : (
                meetings.map((meeting) => {
                  const meetingTitle = meeting.appointment_type.replace(/^(Staff|Internal|Client) Meeting:\s*/, '');
                  return (
                    <div key={meeting.id} className="flex items-start justify-between p-4 bg-muted/50 rounded-lg border border-border/50">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-foreground">{meetingTitle}</h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(meeting.appointment_date), 'MMM d, yyyy')} at {meeting.appointment_time}
                            </span>
                            {meeting.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {meeting.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="custom" className={getMeetingStatusBadgeClass(meeting.status)}>
                        {meeting.status}
                      </Badge>
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* Appointments Sub-Tab */}
            <TabsContent value="appointments" className="space-y-3 mt-0">
              {bookingsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading appointments...
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No appointments assigned yet.
                </div>
              ) : (
                bookings.map((booking) => {
                  const startDate = new Date(booking.start_time);
                  const endDate = new Date(booking.end_time);
                  return (
                    <div key={booking.id} className="flex items-start justify-between p-4 bg-muted/50 rounded-lg border border-border/50">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-foreground">
                            {booking.client_name || 'Unknown Client'}
                          </h4>
                          {booking.service_names && booking.service_names.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {booking.service_names.join(', ')}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(startDate, 'MMM d, yyyy')} • {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="custom" className={getBookingStatusBadgeClass(booking.status || '')}>
                        {booking.status || 'Unknown'}
                      </Badge>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Schedule Meeting Dialog */}
      <NewMeetingDialog
        open={meetingDialogOpen}
        onOpenChange={setMeetingDialogOpen}
        branchId={branchId}
        prefilledStaffId={carerId}
      />
    </div>
  );
};
