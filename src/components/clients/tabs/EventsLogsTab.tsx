
import React, { useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, Clock, Plus, User, Eye, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useClientEvents, useUpdateClientEventStatus } from "@/hooks/useClientEvents";
import { EventDetailsDialog } from "@/components/events-logs/EventDetailsDialog";
import { EventLogForm } from "@/components/events-logs/EventLogForm";
import { exportEventToPDFBlob } from "@/lib/exportEvents";
import { UnifiedShareDialog } from "@/components/sharing/UnifiedShareDialog";

interface EventsLogsTabProps {
  clientId: string;
  carePlanId?: string;
  patientName?: string;
  clientName?: string;
  onAddEvent?: () => void;
  branchId?: string;
}

export const EventsLogsTab: React.FC<EventsLogsTabProps> = ({ 
  clientId, 
  carePlanId, 
  patientName, 
  clientName,
  onAddEvent,
  branchId
}) => {
  const { data: events = [], isLoading } = useClientEvents(clientId);
  const updateStatusMutation = useUpdateClientEventStatus();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [eventToShare, setEventToShare] = useState<any>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'incident':
      case 'safety':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: eventId, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleShareEvent = (event: any) => {
    setEventToShare(event);
    setShareDialogOpen(true);
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
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
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
            Incident reports and event logs{(patientName || clientName) ? ` for ${patientName || clientName}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">No events logged for this client</p>
              <Button variant="outline" className="mt-3" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Event
              </Button>
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
                        <Badge variant="custom" className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {event.event_type}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                    <div className="flex flex-col gap-2">
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
                        onClick={() => handleShareEvent(event)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      
                      <Select
                        value={event.status}
                        onValueChange={(value) => handleStatusChange(event.id, value)}
                      >
                        <SelectTrigger className="w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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

      {/* Add Event Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <EventLogForm
            branchId={branchId || ''}
            defaultClientId={clientId}
            onSuccess={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

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
