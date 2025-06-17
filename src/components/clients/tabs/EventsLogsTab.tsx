
import React, { useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, Clock, Plus, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddEventDialog } from "../dialogs/AddEventDialog";
import { useClientEvents, useCreateClientEvent } from "@/hooks/useClientEvents";

interface EventsLogsTabProps {
  clientId: string;
  onAddEvent?: () => void;
}

export const EventsLogsTab: React.FC<EventsLogsTabProps> = ({ clientId }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { data: events = [], isLoading } = useClientEvents(clientId);
  const createEventMutation = useCreateClientEvent();

  const handleAddEvent = async (eventData: any) => {
    await createEventMutation.mutateAsync({
      client_id: clientId,
      event_type: eventData.event_type,
      title: eventData.title,
      description: eventData.description,
      severity: eventData.severity,
      reporter: eventData.reporter,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'incident':
      case 'safety':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Events & Logs</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Add Event</span>
            </Button>
          </div>
          <CardDescription>Incident reports and event logs for client {clientId}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No events logged for this client</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(event.event_type)}
                        <h3 className="font-medium">{event.title}</h3>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {event.event_type}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Reported by: {event.reporter}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddEventDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleAddEvent}
      />
    </div>
  );
};
