import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, MapPin, Eye, AlertTriangle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useUserRole } from '@/hooks/useUserRole';
import { useEventsLogs } from '@/data/hooks/useEventsLogs';
import { EventDetailsDialog } from '@/components/events-logs/EventDetailsDialog';
import type { EventLog } from '@/data/hooks/useEventsLogs';
import { getDeepLinkData, clearDeepLinkKey } from '@/utils/notificationRouting';

const CarerEventsLogs: React.FC = () => {
  const { data: userRole } = useUserRole();
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filter to show only events assigned to current user
  const filters = {
    assignedToMe: userRole?.staffId || userRole?.id,
  };

  const { data: assignedEvents = [], isLoading, error } = useEventsLogs(
    userRole?.branchId, 
    filters
  );

  // Auto-open event from notification deep link
  useEffect(() => {
    const openEventId = getDeepLinkData('openEventId');
    if (openEventId && assignedEvents && assignedEvents.length > 0) {
      const eventToOpen = assignedEvents.find((e) => e.id === openEventId);
      if (eventToOpen) {
        setSelectedEvent(eventToOpen);
        setIsDetailsOpen(true);
        clearDeepLinkKey('openEventId');
      }
    }
  }, [assignedEvents]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-600 text-white border-blue-700';
      case 'in-progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAssignmentType = (event: EventLog) => {
    const staffId = userRole?.staffId || userRole?.id;
    if (event.investigation_assigned_to === staffId) {
      return { label: 'Investigation Assigned', color: 'bg-red-100 text-red-800 border-red-200' };
    }
    if (event.follow_up_assigned_to === staffId) {
      return { label: 'Follow-up Required', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    }
    if (event.recorded_by_staff_id === staffId) {
      return { label: 'Recorded By', color: 'bg-blue-600 text-white border-blue-700' };
    }
    return { label: 'Assigned', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  const handleViewDetails = (event: EventLog) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  // Calculate summary statistics
  const totalEvents = assignedEvents.length;
  const pendingFollowups = assignedEvents.filter(e => 
    e.follow_up_assigned_to === (userRole?.staffId || userRole?.id) && e.status !== 'resolved' && e.status !== 'closed'
  ).length;
  const investigationRequired = assignedEvents.filter(e => 
    e.investigation_assigned_to === (userRole?.staffId || userRole?.id) && e.status !== 'resolved' && e.status !== 'closed'
  ).length;
  const recordedByMe = assignedEvents.filter(e => 
    e.recorded_by_staff_id === (userRole?.staffId || userRole?.id)
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-destructive" />
        <p className="text-destructive font-medium">Error loading events & logs</p>
        <p className="text-muted-foreground text-sm mt-1">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Events & Logs</h1>
        <p className="text-sm text-muted-foreground">
          View all events and logs assigned to you
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assigned</p>
                <p className="text-2xl font-bold">{totalEvents}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Follow-ups</p>
                <p className="text-2xl font-bold text-orange-600">{pendingFollowups}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investigation Required</p>
                <p className="text-2xl font-bold text-red-600">{investigationRequired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recorded by Me</p>
                <p className="text-2xl font-bold text-blue-600">{recordedByMe}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {assignedEvents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">No events assigned</p>
              <p className="text-muted-foreground text-sm mt-1">
                You currently have no events or logs assigned to you
              </p>
            </CardContent>
          </Card>
        ) : (
          assignedEvents.map((event) => {
            const assignmentType = getAssignmentType(event);
            
            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header with badges */}
                      <div className="flex flex-wrap items-start gap-2">
                        <Badge variant="outline" className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <Badge variant="outline">{event.event_type}</Badge>
                        <Badge variant="outline" className={assignmentType.color}>
                          {assignmentType.label}
                        </Badge>
                      </div>

                      {/* Event Title */}
                      <div>
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        {event.client_name && (
                          <p className="text-sm text-primary font-medium mt-1">
                            Client: {event.client_name}
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      {event.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Event Details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {event.event_date 
                              ? format(new Date(event.event_date), 'MMM dd, yyyy') 
                              : format(new Date(event.created_at), 'MMM dd, yyyy')}
                          </span>
                          {event.event_time && <span>at {event.event_time}</span>}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Follow-up Date if applicable */}
                      {event.follow_up_date && event.follow_up_assigned_to === (userRole?.staffId || userRole?.id) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-orange-50">
                            <Calendar className="h-3 w-3 mr-1" />
                            Follow-up Due: {format(new Date(event.follow_up_date), 'MMM dd, yyyy')}
                          </Badge>
                        </div>
                      )}

                      {/* Investigation Date if applicable */}
                      {event.expected_resolution_date && event.investigation_assigned_to === (userRole?.staffId || userRole?.id) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-red-50">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expected Resolution: {format(new Date(event.expected_resolution_date), 'MMM dd, yyyy')}
                          </Badge>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div>
                        <Badge variant="outline" className={getStatusColor(event.status)}>
                          Status: {event.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(event)}
                        className="flex-1 md:flex-none"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={selectedEvent}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
};

export default CarerEventsLogs;
