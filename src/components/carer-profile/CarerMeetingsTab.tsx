import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Video, Plus } from "lucide-react";

interface CarerMeetingsTabProps {
  carerId: string;
}

export const CarerMeetingsTab: React.FC<CarerMeetingsTabProps> = ({ carerId }) => {
  const meetings = [
    {
      id: 1,
      title: 'Team Meeting',
      date: '2024-02-15',
      time: '10:00',
      duration: 60,
      type: 'team',
      status: 'scheduled',
      attendees: 8
    },
    {
      id: 2,
      title: 'Performance Review',
      date: '2024-02-20',
      time: '14:00',
      duration: 45,
      type: 'one-on-one',
      status: 'scheduled',
      attendees: 2
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Meetings & Appointments
          </CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{meeting.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(meeting.date).toLocaleDateString()} at {meeting.time}</span>
                      <Users className="h-3 w-3 ml-2" />
                      <span>{meeting.attendees} attendees</span>
                    </div>
                  </div>
                </div>
                <Badge>{meeting.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};