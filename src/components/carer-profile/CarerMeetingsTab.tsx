import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Video, Plus } from "lucide-react";
import { NewMeetingDialog } from "@/components/organization-calendar/NewMeetingDialog";
import { useStaffMeetings } from "@/hooks/useStaffMeetings";
import { format } from "date-fns";

interface CarerMeetingsTabProps {
  carerId: string;
  branchId?: string;
}

export const CarerMeetingsTab: React.FC<CarerMeetingsTabProps> = ({ carerId, branchId }) => {
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const { data: meetings = [], isLoading } = useStaffMeetings(carerId);

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
          <div className="space-y-3">
            {isLoading ? (
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
                  <div key={meeting.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{meetingTitle}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(meeting.appointment_date), 'MMM d, yyyy')} at {meeting.appointment_time}
                          </span>
                          {meeting.location && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{meeting.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge>{meeting.status}</Badge>
                  </div>
                );
              })
            )}
          </div>
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