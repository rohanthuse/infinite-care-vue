
import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Calendar, Clock, MapPin, User, FileText, MoreVertical, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { useEventsLogs, useUpdateEventLogStatus, useDeleteEventLog } from '@/data/hooks/useEventsLogs';
import { EventDetailsDialog } from './EventDetailsDialog';

interface EventLogsListProps {
  branchId: string;
}

export function EventLogsList({ branchId }: EventLogsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const itemsPerPage = 10;

  const filters = {
    searchQuery: searchTerm,
    typeFilter: filterType,
    statusFilter: filterStatus,
    categoryFilter: filterCategory,
    dateFilter: dateFilter,
  };

  const { data: events = [], isLoading, error } = useEventsLogs(branchId, filters);
  const updateStatusMutation = useUpdateEventLogStatus();
  const deleteEventMutation = useDeleteEventLog();

  // Pagination
  const totalPages = Math.ceil(events.length / itemsPerPage);
  const paginatedEvents = events.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedEvent || !newStatus) return;
    
    try {
      await updateStatusMutation.mutateAsync({
        id: selectedEvent.id,
        status: newStatus,
      });
      setStatusDialogOpen(false);
      setSelectedEvent(null);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await deleteEventMutation.mutateAsync(selectedEvent.id);
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      accident: "bg-amber-50 text-amber-700 border-amber-200",
      incident: "bg-orange-50 text-orange-700 border-orange-200",
      near_miss: "bg-yellow-50 text-yellow-700 border-yellow-200",
      medication_error: "bg-red-50 text-red-700 border-red-200",
      safeguarding: "bg-purple-50 text-purple-700 border-purple-200",
      complaint: "bg-blue-50 text-blue-700 border-blue-200",
      compliment: "bg-green-50 text-green-700 border-green-200",
      other: "bg-gray-50 text-gray-700 border-gray-200",
    };
    
    return (
      <Badge variant="outline" className={styles[category as keyof typeof styles] || styles.other}>
        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-red-500" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Error Loading Events</h3>
        <p className="text-gray-500">Failed to load events and logs. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row gap-4 items-end bg-white pb-4">
        <div className="flex-1">
          <label htmlFor="search" className="text-sm font-medium mb-1 block">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              id="search"
              placeholder="Search by title, reporter, or description..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-full md:w-48">
          <label htmlFor="type" className="text-sm font-medium mb-1 block">Type</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger id="type">
              <SelectValue placeholder="All Types" />
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
        </div>
        
        <div className="w-full md:w-48">
          <label htmlFor="status" className="text-sm font-medium mb-1 block">Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="All Statuses" />
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
        
        <div className="w-full md:w-48">
          <label htmlFor="date" className="text-sm font-medium mb-1 block">Date Range</label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger id="date">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-shrink-0">
          <Button variant="outline" className="flex items-center w-full">
            <Download className="h-4 w-4 mr-2" />
            <span className="truncate">Export</span>
          </Button>
        </div>
      </div>
      
      <div className="space-y-4 w-full">
        {paginatedEvents.length > 0 ? (
          paginatedEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow w-full">
              <CardContent className="p-0">
                <div className="p-4 flex flex-col md:flex-row justify-between border-b border-gray-100 gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium truncate">{event.title}</h3>
                      {getCategoryBadge(event.category)}
                      {getSeverityBadge(event.severity)}
                    </div>
                    <p className="text-sm text-gray-500 truncate">ID: {event.id.slice(0, 8)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 md:mt-0 flex-shrink-0">
                    {getStatusBadge(event.status)}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuItem onSelect={() => {
                          setSelectedEvent(event);
                          setViewDialogOpen(true);
                        }}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => {
                          setSelectedEvent(event);
                          handleStatusChange('open');
                        }}>
                          Mark as Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => {
                          setSelectedEvent(event);
                          handleStatusChange('in-progress');
                        }}>
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => {
                          setSelectedEvent(event);
                          handleStatusChange('resolved');
                        }}>
                          Mark as Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => {
                          setSelectedEvent(event);
                          handleStatusChange('closed');
                        }}>
                          Mark as Closed
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onSelect={() => {
                            setSelectedEvent(event);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(event);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start">
                    <User className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="min-w-0 truncate">
                      <div className="text-xs text-gray-500">Reporter</div>
                      <div className="text-sm truncate">{event.reporter}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="min-w-0 truncate">
                      <div className="text-xs text-gray-500">Location</div>
                      <div className="text-sm truncate">{event.location || 'Not specified'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="min-w-0 truncate">
                      <div className="text-xs text-gray-500">Date & Time</div>
                      <div className="text-sm truncate">
                        {format(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
                
                {event.description && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-start">
                      <FileText className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700 line-clamp-2 break-words">{event.description}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
            <p className="text-gray-500">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No events have been logged yet'}
            </p>
          </div>
        )}
      </div>
      
      {events.length > 0 && totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + index;
              if (pageNum > totalPages) return null;
              
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(pageNum);
                    }}
                    isActive={currentPage === pageNum}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Event Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status of this event to "{newStatus.replace('-', ' ')}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? 'Deleting...' : 'Delete Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        />
      )}
    </div>
  );
}
