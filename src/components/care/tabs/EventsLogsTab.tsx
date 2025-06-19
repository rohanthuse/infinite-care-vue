
import React, { useState } from "react";
import { Search, Filter, Plus, Calendar, Clock, MapPin, User, FileBarChart2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface EventOrLog {
  id: string;
  title: string;
  eventType: string;
  clientName?: string;
  staffName?: string;
  location: string;
  date: string;
  time: string;
  category: string;
  status: string;
  details: string;
  carePlanId?: string;
}

interface EventsLogsTabProps {
  carePlanId: string;
  patientName: string;
  onAddEvent?: () => void;
}

export const EventsLogsTab: React.FC<EventsLogsTabProps> = ({ 
  carePlanId, 
  patientName, 
  onAddEvent 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock events data related to the current care plan
  const mockEvents: EventOrLog[] = [
    {
      id: 'EV001-CP',
      title: 'Medication Error',
      eventType: 'client',
      clientName: patientName,
      location: 'Client\'s Home',
      date: '2025-04-10',
      time: '09:30',
      category: 'medication_error',
      status: 'Pending Review',
      details: 'Client was given the wrong medication dose.',
      carePlanId: carePlanId
    },
    {
      id: 'EV002-CP',
      title: 'Fall Incident',
      eventType: 'client',
      clientName: patientName,
      location: 'Bathroom',
      date: '2025-04-09',
      time: '14:15',
      category: 'accident',
      status: 'In Progress',
      details: 'Client slipped in the bathroom, no serious injuries.',
      carePlanId: carePlanId
    },
    {
      id: 'EV003-CP',
      title: 'Care Plan Review',
      eventType: 'client',
      clientName: patientName,
      location: 'Med-Infinite Office',
      date: '2025-04-08',
      time: '11:00',
      category: 'review',
      status: 'Completed',
      details: 'Quarterly care plan review completed with client and family.',
      carePlanId: carePlanId
    }
  ];

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
      case 'review':
        return <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">Review</Badge>;
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
      case 'Completed':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">{status}</Badge>;
      case 'Closed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-100 shadow-sm">
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileBarChart2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Events & Logs</CardTitle>
            </div>
            <Button 
              onClick={onAddEvent} 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>New Event</span>
            </Button>
          </div>
          <CardDescription>Records of incidents, events, and logs for this care plan</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4 items-end pb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search events..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="medication_error">Medication Error</SelectItem>
                  <SelectItem value="safeguarding">Safeguarding</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-48">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending Review">Pending Review</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Button variant="ghost" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileBarChart2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No events or logs found for this care plan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4 flex flex-col md:flex-row justify-between border-b border-gray-100 gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{event.title}</h3>
                        {getCategoryBadge(event.category)}
                      </div>
                      <p className="text-sm text-gray-500">Reference: {event.id}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(event.status)}
                      
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Date & Time</div>
                        <div className="text-sm">
                          {event.date} at {event.time}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Location</div>
                        <div className="text-sm">{event.location}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">
                          {event.eventType === 'client' ? 'Client' : 'Staff Member'}
                        </div>
                        <div className="text-sm">
                          {event.eventType === 'client' ? event.clientName : event.staffName}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 pb-4">
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {event.details}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
