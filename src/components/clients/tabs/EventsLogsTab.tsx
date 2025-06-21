
import React, { useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, Clock, Plus, User, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientEvents } from "@/hooks/useClientEvents";
import { EventDetailsDialog } from "@/components/events-logs/EventDetailsDialog";

interface EventsLogsTabProps {
  clientId: string;
  carePlanId?: string;
  patientName?: string;
  onAddEvent?: () => void;
}

export const EventsLogsTab: React.FC<EventsLogsTabProps> = ({ 
  clientId, 
  carePlanId, 
  patientName, 
  onAddEvent 
}) => {
  const { data: events = [], isLoading } = useClientEvents(clientId);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
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
            <Button size="sm" className="gap-1" onClick={onAddEvent}>
              <Plus className="h-4 w-4" />
              <span>Add Event</span>
            </Button>
          </div>
          <CardDescription>
            Incident reports and event logs for {patientName || `client ${clientId}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No events logged for this client</p>
              {onAddEvent && (
                <Button variant="outline" className="mt-3" onClick={onAddEvent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Event
                </Button>
              )}
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
                        <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
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
                        {event.body_map_points && Array.isArray(event.body_map_points) && event.body_map_points.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{event.body_map_points.length} body map point(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(event)}
                      className="ml-4"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={selectedEvent}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
};
