import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Calendar, Clock, MapPin, User, FileText, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "sonner";
import { AttendanceInfo } from './AttendanceInfo';

const mockEvents = [
  {
    id: 'EV001',
    title: 'Medication Error',
    eventType: 'client',
    clientName: 'James Wilson',
    location: 'Client\'s Home',
    date: '2025-04-10',
    time: '09:30',
    category: 'medication_error',
    status: 'Pending Review',
    details: 'Client was given the wrong medication dose.',
    staffPresent: [
      { id: 'ST001', name: 'Alex Chen', timeIn: '09:15', timeOut: '10:30' },
      { id: 'ST003', name: 'John Williams', timeIn: '09:20', timeOut: '10:45' }
    ],
    otherAttendees: [
      { id: 'OA001', name: 'Emily Wilson', relationship: 'family' }
    ]
  },
  {
    id: 'EV002',
    title: 'Fall Incident',
    eventType: 'client',
    clientName: 'Emma Williams',
    location: 'Bathroom',
    date: '2025-04-09',
    time: '14:15',
    category: 'accident',
    status: 'In Progress',
    details: 'Client slipped in the bathroom, no serious injuries.',
    staffPresent: [
      { id: 'ST002', name: 'Maria Rodriguez', timeIn: '14:00', timeOut: '15:30' }
    ],
    otherAttendees: []
  },
  {
    id: 'EV003',
    title: 'Client Complaint',
    eventType: 'client',
    clientName: 'Daniel Smith',
    location: 'Med-Infinite Office',
    date: '2025-04-08',
    time: '11:00',
    category: 'complaint',
    status: 'Resolved',
    details: 'Client complained about the quality of care provided.',
    staffPresent: [
      { id: 'ST005', name: 'David Brown', timeIn: '10:45', timeOut: '12:15' },
      { id: 'ST001', name: 'Alex Chen', timeIn: '10:50', timeOut: '12:10' }
    ],
    otherAttendees: [
      { id: 'OA002', name: 'Robert Smith', relationship: 'family' }
    ]
  },
  {
    id: 'EV004',
    title: 'Staff Injury',
    eventType: 'staff',
    staffName: 'Sarah Johnson',
    location: 'Client\'s Home',
    date: '2025-04-07',
    time: '16:45',
    category: 'accident',
    status: 'Closed',
    details: 'Staff member injured back while helping client.',
    staffPresent: [
      { id: 'ST004', name: 'Sarah Johnson', timeIn: '16:30', timeOut: '17:45' },
      { id: 'ST002', name: 'Maria Rodriguez', timeIn: '16:15', timeOut: '17:30' }
    ],
    otherAttendees: []
  },
  {
    id: 'EV005',
    title: 'Safeguarding Concern',
    eventType: 'client',
    clientName: 'Sophia Martinez',
    location: 'Client\'s Home',
    date: '2025-04-05',
    time: '10:30',
    category: 'safeguarding',
    status: 'Pending Review',
    details: 'Potential signs of neglect observed.',
    staffPresent: [
      { id: 'ST003', name: 'John Williams', timeIn: '10:00', timeOut: '11:45' }
    ],
    otherAttendees: [
      { id: 'OA003', name: 'Dr. Thomas Lee', relationship: 'professional' }
    ]
  }
];

interface EventLogsListProps {
  branchId: string;
}

export function EventLogsList({ branchId }: EventLogsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [events, setEvents] = useState(mockEvents);
  const itemsPerPage = 5;

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [branchId]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.clientName && event.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.staffName && event.staffName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      event.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = () => {
    if (!selectedEvent || !newStatus) return;
    
    const updatedEvents = events.map(event => {
      if (event.id === selectedEvent.id) {
        return { ...event, status: newStatus };
      }
      return event;
    });
    
    setEvents(updatedEvents);
    
    toast.success(`Status updated to ${newStatus}`, {
      description: `Event ${selectedEvent.id} status has been updated`
    });
    
    setStatusDialogOpen(false);
    setSelectedEvent(null);
    setNewStatus('');
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'accident':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Accident</Badge>;
      case 'incident':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Incident</Badge>;
      case 'near_miss':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Near Miss</Badge>;
      case 'medication_error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Medication Error</Badge>;
      case 'safeguarding':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Safeguarding</Badge>;
      case 'complaint':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Complaint</Badge>;
      case 'compliment':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Compliment</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Draft</Badge>;
      case 'Pending Review':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Pending Review</Badge>;
      case 'In Progress':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">In Progress</Badge>;
      case 'Resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Resolved</Badge>;
      case 'Closed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <Skeleton className="h-9 w-full flex-1" />
          <Skeleton className="h-9 w-full md:w-48" />
          <Skeleton className="h-9 w-full md:w-48" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label htmlFor="search" className="text-sm font-medium mb-1 block">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              id="search"
              placeholder="Search by ID, name, or keyword..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-full md:w-48">
          <label htmlFor="category" className="text-sm font-medium mb-1 block">Category</label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="z-[100]">
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
        </div>
        
        <div className="w-full md:w-48">
          <label htmlFor="status" className="text-sm font-medium mb-1 block">Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="z-[100]">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Pending Review">Pending Review</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Button variant="outline" className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
        
        <div>
          <Button variant="outline" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {paginatedEvents.length > 0 ? (
          paginatedEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="p-4 flex flex-col md:flex-row justify-between border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{event.title}</h3>
                      {getCategoryBadge(event.category)}
                    </div>
                    <p className="text-sm text-gray-500">Reference: {event.id}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 md:mt-0">
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
                          handleStatusChange('Pending Review');
                        }}>
                          Mark as Pending Review
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => {
                          setSelectedEvent(event);
                          handleStatusChange('In Progress');
                        }}>
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => {
                          setSelectedEvent(event);
                          handleStatusChange('Resolved');
                        }}>
                          Mark as Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => {
                          setSelectedEvent(event);
                          handleStatusChange('Closed');
                        }}>
                          Mark as Closed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-start">
                    <User className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">
                        {event.eventType === 'client' ? 'Client' : 'Staff Member'}
                      </div>
                      <div className="text-sm">
                        {event.eventType === 'client' ? event.clientName : event.staffName}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">Location</div>
                      <div className="text-sm">{event.location}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">Date & Time</div>
                      <div className="text-sm">
                        {new Date(event.date).toLocaleDateString()} at {event.time}
                      </div>
                    </div>
                  </div>
                  
                  <AttendanceInfo 
                    staffPresent={event.staffPresent} 
                    otherAttendees={event.otherAttendees} 
                  />
                </div>
                
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-start">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                    <p className="text-sm text-gray-700 line-clamp-2">{event.details}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
      
      {filteredEvents.length > 0 && (
        <Pagination>
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
            
            {Array.from({ length: totalPages }).map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(index + 1);
                  }}
                  isActive={currentPage === index + 1}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
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

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Event Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status of this event to {newStatus}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
