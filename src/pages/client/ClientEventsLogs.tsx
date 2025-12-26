import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Eye, 
  Filter,
  Search,
  User,
  MapPin
} from "lucide-react";
import { format } from "date-fns";
import { useClientAuth } from "@/hooks/useClientAuth";
import { useClientEvents } from "@/hooks/useClientEvents";
import { EventDetailsDialog } from "@/components/events-logs/EventDetailsDialog";
import { getDeepLinkData, clearDeepLinkKey } from "@/utils/notificationRouting";

const ClientEventsLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get authenticated client ID
  const { clientId, isAuthenticated } = useClientAuth();

  // Fetch client events
  const { data: events, isLoading, error } = useClientEvents(clientId || "");

  // Auto-open event from notification deep link
  useEffect(() => {
    const openEventId = getDeepLinkData('openEventId');
    if (openEventId && events && events.length > 0) {
      const eventToOpen = events.find((e: any) => e.id === openEventId);
      if (eventToOpen) {
        setSelectedEvent(eventToOpen);
        setDialogOpen(true);
        clearDeepLinkKey('openEventId');
      }
    }
  }, [events]);

  if (!isAuthenticated || !clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to view your events and logs.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Events</h3>
          <p className="text-muted-foreground">Unable to load your events. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Filter events based on search term
  const filteredEvents = events?.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.reporter.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700';
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'in-progress': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'incident':
      case 'accident':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'observation':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'medication':
        return <Calendar className="h-4 w-4 text-green-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events & Logs</h1>
          <p className="text-muted-foreground mt-1">View your care events and incident logs</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Showing {filteredEvents.length} of {events?.length || 0} events</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {events?.length === 0 ? "No Events Found" : "No Matching Events"}
              </h3>
              <p className="text-muted-foreground">
                {events?.length === 0 
                  ? "You don't have any logged events yet."
                  : "Try adjusting your search terms to find what you're looking for."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getEventTypeIcon(event.event_type)}
                      <h3 className="font-semibold text-lg text-foreground">{event.title}</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="custom" className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      <Badge variant="custom" className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                      <Badge variant="outline">
                        {event.event_type}
                      </Badge>
                    </div>

                    {event.description && (
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Reported by: {event.reporter}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(event.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(event.created_at), 'h:mm a')}</span>
                      </div>

                      {event.event_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Event: {format(new Date(event.event_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>

                    {/* Body Map Indicator */}
                    {event.body_map_points && Array.isArray(event.body_map_points) && event.body_map_points.length > 0 && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700">
                          Has Body Map ({event.body_map_points.length} points)
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(event)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={selectedEvent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default ClientEventsLogs;
