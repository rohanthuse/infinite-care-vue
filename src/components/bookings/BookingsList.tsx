import React, { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronLeft, ChevronRight, Search, Filter, Eye, Edit, Clock, MapPin, Calendar, User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Booking } from "./BookingTimeGrid";
import { format } from "date-fns";

interface BookingsListProps {
  bookings: Booking[];
}

export const BookingsList: React.FC<BookingsListProps> = ({ bookings }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Compute actual filter counts
  const statusCounts = bookings.reduce<Record<string, number>>((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});

  // Sort bookings by date and time
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  // Filter bookings based on search and status
  const filteredBookings = sortedBookings.filter(booking => {
    const matchesSearch = 
      booking.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.carerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Paginate bookings
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800 border-0";
      case "assigned":
        return "bg-blue-100 text-blue-800 border-0";
      case "in-progress":
        return "bg-amber-100 text-amber-800 border-0";
      case "departed":
        return "bg-purple-100 text-purple-800 border-0";
      case "cancelled":
        return "bg-red-100 text-red-800 border-0";
      default:
        return "bg-gray-100 text-gray-800 border-0";
    }
  };

  const formatBookingDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Bookings List</h2>
            <p className="text-gray-500 text-sm mt-1">
              View and manage all booked appointments
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-md w-full md:w-auto">
            <Calendar className="h-4 w-4 mr-2" />
            Export Schedule
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search client, carer or booking ID" 
                className="pl-10 pr-4 py-2 rounded-md bg-white border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="w-[200px]">
            <Select 
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full rounded-md border-gray-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Status
                  {typeof statusCounts === "object" ? (
                    <Badge className="ml-2">{Object.values(statusCounts).reduce((a, b) => a + b, 0)}</Badge>
                  ) : null}
                </SelectItem>
                <SelectItem value="assigned">Assigned <Badge className="ml-2">{statusCounts.assigned || 0}</Badge></SelectItem>
                <SelectItem value="in-progress">In Progress <Badge className="ml-2">{statusCounts["in-progress"] || 0}</Badge></SelectItem>
                <SelectItem value="done">Done <Badge className="ml-2">{statusCounts.done || 0}</Badge></SelectItem>
                <SelectItem value="departed">Departed <Badge className="ml-2">{statusCounts.departed || 0}</Badge></SelectItem>
                <SelectItem value="cancelled">Cancelled <Badge className="ml-2">{statusCounts.cancelled || 0}</Badge></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-medium">Booking ID</TableHead>
              <TableHead className="font-medium">Date</TableHead>
              <TableHead className="font-medium">Time</TableHead>
              <TableHead className="font-medium">Client</TableHead>
              <TableHead className="font-medium">Carer</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Duration</TableHead>
              <TableHead className="font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBookings.length > 0 ? (
              paginatedBookings.map((booking) => {
                // Calculate duration in minutes
                const startParts = booking.startTime.split(':').map(Number);
                const endParts = booking.endTime.split(':').map(Number);
                const startMins = startParts[0] * 60 + startParts[1];
                const endMins = endParts[0] * 60 + endParts[1];
                const durationMins = endMins - startMins;
                const hours = Math.floor(durationMins / 60);
                const mins = durationMins % 60;
                const durationText = `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
                
                return (
                  <TableRow key={booking.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{booking.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        {formatBookingDate(booking.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        {booking.startTime} - {booking.endTime}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm mr-2">
                          {booking.clientInitials}
                        </div>
                        {booking.clientName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        {booking.carerName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" 
                        className={`px-2 py-1 rounded-full ${getStatusBadgeClass(booking.status)}`}
                      >
                        {formatStatus(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{durationText}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  No bookings found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {paginatedBookings.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="h-8"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
