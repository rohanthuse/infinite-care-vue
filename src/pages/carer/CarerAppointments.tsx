
import React, { useState } from "react";
import { Calendar, Clock, User, MapPin, Phone, Plus, Filter, Play, Eye, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isToday, isTomorrow, isYesterday, isThisWeek, differenceInMinutes } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCarerAuth } from "@/hooks/useCarerAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useBookingAttendance } from "@/hooks/useBookingAttendance";
import { toast } from "sonner";

const CarerAppointments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { user } = useCarerAuth();
  const navigate = useNavigate();
  const bookingAttendance = useBookingAttendance();

  // Get appointments from database
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['carer-appointments-full', user?.id, statusFilter],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          clients(first_name, last_name, phone, address),
          services(title, description)
        `)
        .eq('staff_id', user.id)
        .order('start_time');

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Filter appointments based on search term
  const filteredAppointments = appointments.filter(appointment => {
    const searchLower = searchTerm.toLowerCase();
    const clientName = `${appointment.clients?.first_name || ''} ${appointment.clients?.last_name || ''}`.toLowerCase();
    const serviceName = appointment.services?.title?.toLowerCase() || '';
    
    return clientName.includes(searchLower) || serviceName.includes(searchLower);
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'assigned':
      case 'scheduled':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    if (isThisWeek(date)) return format(date, "EEEE");
    return format(date, "MMM dd, yyyy");
  };

  // Check if appointment can be started (within 30 minutes of start time)
  const canStartAppointment = (appointment: any) => {
    const now = new Date();
    const startTime = new Date(appointment.start_time);
    const minutesDiff = differenceInMinutes(startTime, now);
    
    return (
      (appointment.status === 'assigned' || appointment.status === 'scheduled') &&
      minutesDiff <= 30 && minutesDiff >= -30 // Within 30 minutes before or after
    );
  };

  const handleStartVisit = async (appointment: any) => {
    try {
      // Navigate to visit workflow
      navigate(`/carer-dashboard/visit/${appointment.id}`);
    } catch (error) {
      console.error('Error starting visit:', error);
      toast.error('Failed to start visit');
    }
  };

  const getActionButton = (appointment: any) => {
    const status = appointment.status?.toLowerCase();
    
    if (status === 'completed') {
      return (
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          View Details
        </Button>
      );
    }
    
    if (status === 'in-progress') {
      return (
        <Button 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => navigate(`/carer-dashboard/visit/${appointment.id}`)}
        >
          <ArrowRight className="h-4 w-4" />
          Continue Visit
        </Button>
      );
    }
    
    if (canStartAppointment(appointment)) {
      return (
        <Button 
          size="sm" 
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          onClick={() => handleStartVisit(appointment)}
        >
          <Play className="h-4 w-4" />
          Start Visit
        </Button>
      );
    }
    
    return null;
  };

  const getTimeInfo = (appointment: any) => {
    const now = new Date();
    const startTime = new Date(appointment.start_time);
    const minutesDiff = differenceInMinutes(startTime, now);
    
    if (Math.abs(minutesDiff) <= 30 && appointment.status !== 'completed') {
      if (minutesDiff > 0) {
        return (
          <div className="text-xs text-amber-600 font-medium">
            Starts in {minutesDiff} minutes
          </div>
        );
      } else if (minutesDiff < 0) {
        return (
          <div className="text-xs text-red-600 font-medium">
            Started {Math.abs(minutesDiff)} minutes ago
          </div>
        );
      } else {
        return (
          <div className="text-xs text-green-600 font-medium">
            Starting now
          </div>
        );
      }
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">My Appointments</h1>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Appointments</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="assigned">Scheduled</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {formatAppointmentDate(appointment.start_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>
                          {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {appointment.clients?.first_name} {appointment.clients?.last_name}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Service:</strong> {appointment.services?.title || 'N/A'}
                    </div>
                    
                    {appointment.clients?.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>{appointment.clients.address}</span>
                      </div>
                    )}
                    
                    {appointment.clients?.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{appointment.clients.phone}</span>
                      </div>
                    )}
                    
                    {getTimeInfo(appointment)}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status === 'assigned' ? 'Scheduled' : appointment.status}
                    </Badge>
                    {appointment.revenue && (
                      <div className="text-sm text-gray-600">
                        £{appointment.revenue}
                      </div>
                    )}
                    {getActionButton(appointment)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? "Try adjusting your search or filters" : "You don't have any appointments yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CarerAppointments;
