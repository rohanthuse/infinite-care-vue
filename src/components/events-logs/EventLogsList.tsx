import React, { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Search, Filter, Calendar, MapPin, User, Eye, Trash2, RotateCcw, Download, FileText } from 'lucide-react';
import { useEventsLogs, useUpdateEventLogStatus, useDeleteEventLog } from '@/data/hooks/useEventsLogs';
import { EventDetailsDialog } from './EventDetailsDialog';
import { EventLog } from '@/data/hooks/useEventsLogs';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { exportEventsToCSV, exportEventsListToPDF } from '@/lib/exportEvents';

interface EventLogsListProps {
  branchId: string;
}

export function EventLogsList({ branchId }: EventLogsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: userRole } = useUserRole();

  const filters = {
    searchQuery: searchQuery || undefined,
    typeFilter: typeFilter !== 'all' ? typeFilter : undefined,
    statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
    categoryFilter: categoryFilter !== 'all' ? categoryFilter : undefined,
    dateFilter: dateFilter !== 'all' ? dateFilter : undefined,
    assignedToMe: assignedToMe ? userRole?.staffId || userRole?.id : undefined,
  };

  const { data: events = [], isLoading, error } = useEventsLogs(branchId, filters);
  const updateStatusMutation = useUpdateEventLogStatus();
  const deleteEventMutation = useDeleteEventLog();

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
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: eventId, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update event status');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await deleteEventMutation.mutateAsync(eventId);
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event');
      }
    }
  };

  const handleViewDetails = (event: EventLog) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-red-400" />
        <p className="text-red-600 font-medium">Error loading events</p>
        <p className="text-gray-500 text-sm mt-1">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportEventsToCSV(events)}
                disabled={events.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportEventsListToPDF(events)}
                disabled={events.length === 0}
              >
                <FileText className="h-4 w-4 mr-1" />
                Export PDF
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="accident">Accident</SelectItem>
                <SelectItem value="near_miss">Near Miss</SelectItem>
                <SelectItem value="medication_error">Medication Error</SelectItem>
                <SelectItem value="safeguarding">Safeguarding</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="compliment">Compliment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="accident">Accident</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="near_miss">Near Miss</SelectItem>
                <SelectItem value="medication_error">Medication Error</SelectItem>
                <SelectItem value="safeguarding">Safeguarding</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="compliment">Compliment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="assignedToMe" 
              checked={assignedToMe}
              onCheckedChange={(checked) => setAssignedToMe(checked === true)}
            />
            <label 
              htmlFor="assignedToMe" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show only events assigned to me
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">No events found</p>
              <p className="text-gray-400 text-sm mt-1">
                {Object.values(filters).some(f => f) 
                  ? "Try adjusting your filters or create a new event log"
                  : "Create your first event log to get started"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        {event.client_name && (
                          <p className="text-sm text-blue-600 font-medium">Client: {event.client_name}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                          <Badge variant="outline">
                            {event.event_type}
                          </Badge>
                          {event.category && (
                            <Badge variant="outline">
                              {event.category}
                            </Badge>
                          )}
                          {(event.follow_up_assigned_to === userRole?.staffId || 
                            event.investigation_assigned_to === userRole?.staffId || 
                            event.recorded_by_staff_id === userRole?.staffId) && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              Assigned
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Reporter: {event.reporter}</span>
                      </div>
                      {event.recorded_by_staff_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Recorded by: {event.recorded_by_staff_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Event: {event.event_date ? format(new Date(event.event_date), 'MMM dd, yyyy') : format(new Date(event.created_at), 'MMM dd, yyyy')}</span>
                        {event.event_time && <span>at {event.event_time}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Recorded: {format(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
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
                      View
                    </Button>

                    <Select
                      value={event.status}
                      onValueChange={(value) => handleStatusChange(event.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
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
}
