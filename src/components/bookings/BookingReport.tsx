
import React, { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon, 
  FileDown, 
  FileText, 
  Filter,
  RefreshCw,
  Search, 
  User
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Booking } from "./BookingTimeGrid";
import { toast } from "sonner";

interface BookingReportProps {
  bookings: Booking[];
}

// A mapping of status to color for the badges
const statusColors: Record<string, string> = {
  "assigned": "bg-green-100 text-green-800 border-green-200",
  "unassigned": "bg-amber-100 text-amber-800 border-amber-200",
  "done": "bg-blue-100 text-blue-800 border-blue-200",
  "in-progress": "bg-purple-100 text-purple-800 border-purple-200",
  "cancelled": "bg-red-100 text-red-800 border-red-200",
  "departed": "bg-teal-100 text-teal-800 border-teal-200",
  "suspended": "bg-gray-100 text-gray-800 border-gray-200",
}

export const BookingReport: React.FC<BookingReportProps> = ({ bookings }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [reportType, setReportType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [carerFilter, setCarerFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Get unique carers and clients for the dropdowns
  const carers = Array.from(new Set(bookings.map(booking => booking.carerId)))
    .map(id => {
      const booking = bookings.find(b => b.carerId === id);
      return { id, name: booking?.carerName || "" };
    });
  
  const clients = Array.from(new Set(bookings.map(booking => booking.clientId)))
    .map(id => {
      const booking = bookings.find(b => b.clientId === id);
      return { id, name: booking?.clientName || "" };
    });

  // Filter bookings based on current filters
  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    
    // Check if booking matches date range
    const matchesDate = 
      (!date?.from || bookingDate >= date.from) && 
      (!date?.to || bookingDate <= date.to);
      
    // Check if booking matches search query
    const matchesSearch = 
      searchQuery === "" || 
      booking.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.carerName.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Check if booking matches status filter
    const matchesStatus = status === "all" || booking.status === status;
    
    // Check if booking matches carer filter
    const matchesCarer = carerFilter === "all" || booking.carerId === carerFilter;
    
    // Check if booking matches client filter
    const matchesClient = clientFilter === "all" || booking.clientId === clientFilter;
    
    return matchesDate && matchesSearch && matchesStatus && matchesCarer && matchesClient;
  });

  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Report generated successfully", {
        description: `Generated ${reportType} report with ${filteredBookings.length} bookings`
      });
    }, 1500);
  };

  const handleExportReport = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Report exported successfully", {
        description: "The report has been downloaded as a PDF"
      });
    }, 1500);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setReportType("all");
    setStatus("all");
    setDate({
      from: subDays(new Date(), 7),
      to: new Date(),
    });
    setCarerFilter("all");
    setClientFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Booking Reports</h2>
          <p className="text-gray-500 mt-1">Generate and export booking reports with custom filters</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Search & Report Type */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search clients or carers..." 
                className="pl-9" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="daily">Daily Report</SelectItem>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="carer">Carer Performance</SelectItem>
                  <SelectItem value="client">Client Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            
            {/* Status Filter */}
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="departed">Departed</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Carer Filter */}
            <Select value={carerFilter} onValueChange={setCarerFilter}>
              <SelectTrigger>
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select Carer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carers</SelectItem>
                {carers.map(carer => (
                  <SelectItem key={carer.id} value={carer.id}>
                    {carer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Client Filter */}
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={handleGenerateReport}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generate Report
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportReport}
              disabled={isGenerating}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={resetFilters} 
              className="sm:ml-auto"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>
      
      {/* Report Results Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Report Results 
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredBookings.length} bookings)
            </span>
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Carer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.id}</TableCell>
                    <TableCell>{booking.date}</TableCell>
                    <TableCell>{booking.startTime} - {booking.endTime}</TableCell>
                    <TableCell>{booking.clientName}</TableCell>
                    <TableCell>{booking.carerName}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn("capitalize", statusColors[booking.status] || "bg-gray-100")}
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {booking.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No bookings found for the selected filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
