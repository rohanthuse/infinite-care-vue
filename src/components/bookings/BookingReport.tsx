import React, { useState, useMemo } from "react";
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
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon, 
  FileDown, 
  FileText, 
  Filter,
  RefreshCw,
  Search, 
  User,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  PoundSterling
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Booking } from "./BookingTimeGrid";
import { toast } from "sonner";
import { generateBookingReportPDF } from "@/services/enhancedPdfGenerator";
import { ReportGenerator, ReportData } from "@/services/reportGenerator";

interface BookingReportProps {
  bookings: Booking[];
  branchName?: string;
}

// A mapping of status to color for the badges
const statusColors: Record<string, string> = {
  "assigned": "bg-green-500/10 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-500/20",
  "unassigned": "bg-amber-500/10 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-500/20",
  "done": "bg-blue-500/10 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-500/20",
  "in-progress": "bg-purple-500/10 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-500/20",
  "cancelled": "bg-red-500/10 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-500/20",
  "departed": "bg-teal-500/10 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 border-teal-500/20",
  "suspended": "bg-muted text-muted-foreground border-border",
}

export const BookingReport: React.FC<BookingReportProps> = ({ bookings, branchName = "Med-Infinite Branch" }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [reportType, setReportType] = useState<string>("summary");
  const [status, setStatus] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [carerFilter, setCarerFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

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

  const filteredBookings = useMemo(() => {
    const filtered = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      
      const matchesDate = 
        (!date?.from || bookingDate >= date.from) && 
        (!date?.to || bookingDate <= date.to);
        
      const matchesSearch = 
        searchQuery === "" || 
        booking.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.carerName.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesStatus = status === "all" || booking.status === status;
      
      const matchesCarer = carerFilter === "all" || booking.carerId === carerFilter;
      
      const matchesClient = clientFilter === "all" || booking.clientId === clientFilter;
      
      return matchesDate && matchesSearch && matchesStatus && matchesCarer && matchesClient;
    });

    // Generate report data when filters change
    if (filtered.length > 0) {
      const filters = {
        dateRange: date ? { from: date.from!, to: date.to! } : undefined,
        status: status !== 'all' ? status : undefined,
        carerId: carerFilter !== 'all' ? carerFilter : undefined,
        clientId: clientFilter !== 'all' ? clientFilter : undefined,
        reportType
      };
      const data = ReportGenerator.generateReportData(filtered, filters);
      setReportData(data);
    } else {
      setReportData(null);
    }

    return filtered;
  }, [bookings, date, searchQuery, status, carerFilter, clientFilter, reportType]);

  const handleExportPDF = () => {
    if (!date?.from || !date?.to) {
      toast.error("Please select a date range");
      return;
    }

    setIsGenerating(true);
    
    try {
      const filters = {
        dateRange: { from: date.from, to: date.to },
        status: status !== 'all' ? status : undefined,
        carerId: carerFilter !== 'all' ? carerFilter : undefined,
        clientId: clientFilter !== 'all' ? clientFilter : undefined,
        reportType
      };

      generateBookingReportPDF(filteredBookings, filters, branchName, `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`);
      
      toast.success("PDF Report Generated Successfully", {
        description: `Downloaded ${reportType} report with ${filteredBookings.length} bookings for ${branchName}`
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to generate PDF report", {
        description: error instanceof Error ? error.message : "Please try again"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (!date?.from || !date?.to) {
      toast.error("Please select a date range");
      return;
    }

    setIsGenerating(true);
    
    try {
      ReportGenerator.generateCSV(filteredBookings, {
        dateRange: { from: date.from, to: date.to },
        status: status !== 'all' ? status : undefined,
        carerId: carerFilter !== 'all' ? carerFilter : undefined,
        clientId: clientFilter !== 'all' ? clientFilter : undefined,
        reportType
      });
      
      toast.success("CSV Data Exported Successfully", {
        description: `Downloaded booking data with ${filteredBookings.length} records`
      });
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("Failed to export CSV data", {
        description: "Please try again"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setReportType("summary");
    setStatus("all");
    setDate({
      from: subDays(new Date(), 7),
      to: new Date(),
    });
    setCarerFilter("all");
    setClientFilter("all");
    setReportData(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Booking Reports</h2>
          <p className="text-muted-foreground mt-1">Generate and export comprehensive booking reports with Med-Infinite branding</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={handleExportPDF}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Export PDF Report
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              disabled={isGenerating}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV Data
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
      
      {/* Report Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                {reportData.completedBookings} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.completionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {reportData.cancelledBookings} cancelled
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{reportData.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Estimated revenue
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.averageDuration.toFixed(0)}m</div>
              <p className="text-xs text-muted-foreground">
                Per booking
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Performers */}
      {reportData && reportData.topCarers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Carers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.topCarers.map((carer, index) => (
                  <div key={carer.name} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
                         {index + 1}
                       </div>
                       <div>
                         <p className="font-medium">{carer.name}</p>
                         <p className="text-sm text-muted-foreground">{carer.bookings} bookings</p>
                       </div>
                     </div>
                     <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                      {carer.completionRate.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Most Active Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.topClients.map((client, index) => (
                  <div key={client.name} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 flex items-center justify-center text-sm font-medium">
                         {index + 1}
                       </div>
                       <div>
                         <p className="font-medium">{client.name}</p>
                         <p className="text-sm text-muted-foreground">{client.bookings} bookings</p>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Report Results Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Detailed Booking Data 
            <span className="text-sm font-normal text-muted-foreground ml-2">
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
                <TableHead>Duration</TableHead>
                <TableHead>Est. Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => {
                  const duration = (() => {
                    const [startHour, startMin] = booking.startTime.split(':').map(Number);
                    const [endHour, endMin] = booking.endTime.split(':').map(Number);
                    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
                  })();
                  const revenue = (duration / 60) * 25; // £25 per hour base rate
                  
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.id.slice(0, 8)}...</TableCell>
                      <TableCell>{format(new Date(booking.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{booking.startTime} - {booking.endTime}</TableCell>
                      <TableCell>{booking.clientName}</TableCell>
                      <TableCell>{booking.carerName}</TableCell>
                      <TableCell>
                         <Badge 
                           variant="outline" 
                           className={cn("capitalize", statusColors[booking.status] || "bg-muted text-muted-foreground")}
                         >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{duration}m</TableCell>
                      <TableCell>£{revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
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
