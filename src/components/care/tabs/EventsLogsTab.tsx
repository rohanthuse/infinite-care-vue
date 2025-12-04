
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { AlertTriangle, Clock, Plus, User, Eye, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEventsLogs, useCreateEventLog } from "@/data/hooks/useEventsLogs";
import { AddEventDialog } from "@/components/care/dialogs/AddEventDialog";
import { EventDetailsDialog } from "@/components/events-logs/EventDetailsDialog";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";
import { UnifiedShareDialog } from "@/components/sharing/UnifiedShareDialog";
import { exportEventToPDFBlob } from "@/lib/exportEvents";

interface EventsLogsTabProps {
  clientId: string;
  carePlanId?: string;
  patientName?: string;
  onAddEvent?: () => void;
  branchId?: string;
}

export const EventsLogsTab: React.FC<EventsLogsTabProps> = ({ 
  clientId, 
  carePlanId, 
  patientName, 
  onAddEvent,
  branchId
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [eventToShare, setEventToShare] = useState<any>(null);
  
  // Use events logs with client filter instead of client events
  const { data: events = [], isLoading } = useEventsLogs(undefined, { 
    searchQuery: clientId // Filter by client ID 
  });
  const createEventMutation = useCreateEventLog();
  const { carerProfile } = useCarerAuthSafe();

  // Filter events to only show ones for this client
  const clientEvents = events.filter(event => event.client_id === clientId);

  // Auto-open event details from sessionStorage
  useEffect(() => {
    const openEventId = sessionStorage.getItem('openEventId');
    const openEventClientId = sessionStorage.getItem('openEventClientId');
    
    if (openEventId && openEventClientId === clientId && clientEvents.length > 0) {
      const eventToOpen = clientEvents.find(event => event.id === openEventId);
      if (eventToOpen) {
        setSelectedEvent(eventToOpen);
        setIsDetailsOpen(true);
        
        // Clear the sessionStorage keys
        sessionStorage.removeItem('openEventId');
        sessionStorage.removeItem('openEventClientId');
      }
    }
  }, [clientEvents, clientId]);

  const handleAddEvent = async (eventData: any) => {
    await createEventMutation.mutateAsync({
      ...eventData,
      client_id: clientId,
      status: eventData.status || 'open',
    });
    setIsAddDialogOpen(false);
  };

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
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
          <CardDescription>
            Incident reports and event logs for {patientName || `client ${clientId}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {clientEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No events logged for this client</p>
              <Button variant="outline" className="mt-3" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Event
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {clientEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(event.event_type)}
                        <h3 className="font-medium">{event.title}</h3>
                        <Badge variant="custom" className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {event.event_type}
                        </Badge>
                        {(event.follow_up_assigned_to === carerProfile?.id || 
                          event.investigation_assigned_to === carerProfile?.id) && (
                          <Badge variant="custom" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                            Assigned to you
                          </Badge>
                        )}
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
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(event)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEventToShare(event);
                          setShareDialogOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <AddEventDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleAddEvent}
        carePlanId={carePlanId}
        patientName={patientName}
        isLoading={createEventMutation.isPending}
      />

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={selectedEvent}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      {/* Share Dialog */}
      <UnifiedShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        contentId={eventToShare?.id || ''}
        contentType="event"
        contentTitle={eventToShare?.title || ''}
        branchId={branchId || ''}
        onGeneratePDF={async () => await exportEventToPDFBlob(eventToShare)}
      />
    </div>
  );
};
