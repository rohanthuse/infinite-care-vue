
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Search, Filter, Eye, Edit, Trash2, MoreHorizontal, Calendar, User, MapPin } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEventsLogs, useUpdateEventLogStatus, useDeleteEventLog } from '@/data/hooks/useEventsLogs';
import { EventDetailsDialog } from './EventDetailsDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EventLogsListProps {
  branchId: string;
}

export function EventLogsList({ branchId }: EventLogsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const filters = {
    searchQuery: searchQuery || undefined,
    typeFilter: typeFilter !== 'all' ? typeFilter : undefined,
    statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
    categoryFilter: categoryFilter !== 'all' ? categoryFilter : undefined,
    dateFilter: dateFilter !== 'all' ? dateFilter : undefined,
  };

  const { data: events = [], isLoading, error } = useEventsLogs(branchId, filters);
  const updateStatusMutation = useUpdateEventLogStatus();
  const deleteEventMutation = useDeleteEventLog();

  const eventTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'incident', label: 'Incident' },
    { value: 'accident', label: 'Accident' },
    { value: 'near_miss', label: 'Near Miss' },
    { value: 'medication_error', label: 'Medication Error' },
    { value: 'safeguarding', label: 'Safeguarding' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'compliment', label: 'Compliment' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'accident', label: 'Accident' },
    { value: 'incident', label: 'Incident' },
    { value: 'near_miss', label: 'Near Miss' },
    { value: 'medication_error', label: 'Medication Error' },
    { value: 'safeguarding', label: 'Safeguarding' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'compliment', label: 'Compliment' },
    { value: 'other', label: 'Other' },
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
  ];

  const getSeverityBadge = (severity: string) => {
    const styles = {
      low: "bg-green-50 text-green-600 border-green-200",
      medium: "bg-yellow-50 text-yellow-600 border-yellow-200",
      high: "bg-orange-50 text-orange-600 border-orange-200",
      critical: "bg-red-50 text-red-600 border-red-200",
    };
    
    return (
      <Badge variant="outline" className={styles[severity as keyof typeof styles] || styles.low}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: "bg-blue-50 text-blue-600 border-blue-200",
      "in-progress": "bg-amber-50 text-amber-600 border-amber-200",
      resolved: "bg-green-50 text-green-600 border-green-200",
      closed: "bg-gray-50 text-gray-600 border-gray-200",
    };
    
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles] || styles.open}>
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const handleViewEvent = (event: any) => {
    setSelectedEvent(event);
    setIsDetailDialogOpen(true);
  };

  const handleUpdateStatus = async (eventId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: eventId, status: newStatus });
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await deleteEventMutation.mutateAsync(eventId);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Events</h3>
            <p>There was an error loading the events and logs. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Events & Logs
          </CardTitle>
          <CardDescription>
            View and manage all events, incidents, and logs for this branch
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear
            </Button>
          </div>

          <Separator className="mb-6" />

          {/* Events List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
              <p className="text-gray-500">
                {Object.values(filters).some(f => f) 
                  ? "No events match your current filters. Try adjusting your search criteria."
                  : "No events have been recorded yet. Create your first event log using the form above."
                }
              </p>
              {Object.values(filters).some(f => f) && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-lg">{event.title}</h3>
                          {getSeverityBadge(event.severity)}
                          {getStatusBadge(event.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{event.reporter}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {event.event_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {event.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewEvent(event)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateStatus(event.id, event.status === 'open' ? 'in-progress' : 'resolved')}
                            disabled={updateStatusMutation.isPending}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-600"
                            disabled={deleteEventMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
        />
      )}
    </div>
  );
}
