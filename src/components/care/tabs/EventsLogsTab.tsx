
import React, { useState } from "react";
import { Search, Filter, Plus, Calendar, Clock, MapPin, User, FileBarChart2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useClientEvents } from "@/hooks/useClientEvents";

interface EventsLogsTabProps {
  clientId: string;
  patientName: string;
  onAddEvent?: () => void;
}

export const EventsLogsTab: React.FC<EventsLogsTabProps> = ({ 
  clientId, 
  patientName, 
  onAddEvent 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Use real database data
  const { data: events = [], isLoading, error } = useClientEvents(clientId);

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      event.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || event.event_type === filterCategory;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'incident':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Incident</Badge>;
      case 'medical':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Medical Event</Badge>;
      case 'behavioral':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Behavioral</Badge>;
      case 'safety':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Safety Concern</Badge>;
      case 'medication':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Medication</Badge>;
      case 'fall':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Fall</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Open</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p className="text-sm">Error loading events: {error.message}</p>
      </div>
    );
  }

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
          <CardDescription>Records of incidents, events, and logs for {patientName}</CardDescription>
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
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="medical">Medical Event</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="safety">Safety Concern</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="fall">Fall</SelectItem>
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
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
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
              <p className="text-sm">No events or logs found for this client</p>
              {onAddEvent && (
                <Button variant="outline" onClick={onAddEvent} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Event
                </Button>
              )}
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
                        {getCategoryBadge(event.event_type)}
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
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
                  
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Date & Time</div>
                        <div className="text-sm">
                          {format(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Reported By</div>
                        <div className="text-sm">{event.reporter}</div>
                      </div>
                    </div>
                  </div>
                  
                  {event.description && (
                    <div className="px-4 pb-4">
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {event.description}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
