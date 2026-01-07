import React, { useState, useMemo } from "react";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isAfter, isBefore, isEqual } from "date-fns";
import { CalendarDays, Download, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { useCarerBookings } from "@/hooks/useCarerBookings";
import { useCarerProfile } from "@/hooks/useCarerProfile";
import { generateFutureBookingPlanPDF, FutureBookingData } from "@/services/futureBookingPdfGenerator";
import { toast } from "sonner";

type DatePreset = "this_week" | "next_week" | "this_month" | "next_month" | "custom";

interface CarerScheduleReportProps {
  branchName?: string;
}

export const CarerScheduleReport: React.FC<CarerScheduleReportProps> = ({ 
  branchName = "Med-Infinite Branch" 
}) => {
  const { data: carerProfile, isLoading: profileLoading } = useCarerProfile();
  const { data: bookings, isLoading: bookingsLoading } = useCarerBookings(carerProfile?.id);
  
  const [datePreset, setDatePreset] = useState<DatePreset>("this_week");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  // Calculate date range based on preset
  const dateRange = useMemo(() => {
    const today = new Date();
    
    switch (datePreset) {
      case "this_week":
        return {
          from: startOfWeek(today, { weekStartsOn: 1 }),
          to: endOfWeek(today, { weekStartsOn: 1 })
        };
      case "next_week":
        const nextWeekStart = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
        return {
          from: nextWeekStart,
          to: endOfWeek(nextWeekStart, { weekStartsOn: 1 })
        };
      case "this_month":
        return {
          from: startOfMonth(today),
          to: endOfMonth(today)
        };
      case "next_month":
        const nextMonth = addDays(endOfMonth(today), 1);
        return {
          from: startOfMonth(nextMonth),
          to: endOfMonth(nextMonth)
        };
      case "custom":
        return customDateRange?.from && customDateRange?.to
          ? { from: customDateRange.from, to: customDateRange.to }
          : { from: today, to: addDays(today, 7) };
      default:
        return { from: today, to: addDays(today, 7) };
    }
  }, [datePreset, customDateRange]);

  // Filter bookings for future dates within range
  const futureBookings = useMemo(() => {
    if (!bookings || !dateRange.from || !dateRange.to) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return bookings
      .filter(booking => {
        const bookingDate = parseISO(booking.start_time);
        const bookingDateOnly = new Date(bookingDate);
        bookingDateOnly.setHours(0, 0, 0, 0);
        
        // Only future or today bookings
        const isFutureOrToday = isAfter(bookingDateOnly, today) || isEqual(bookingDateOnly, today);
        
        // Within date range
        const isWithinRange = 
          (isAfter(bookingDateOnly, dateRange.from!) || isEqual(bookingDateOnly, dateRange.from!)) &&
          (isBefore(bookingDateOnly, dateRange.to!) || isEqual(bookingDateOnly, dateRange.to!));
        
        // Not cancelled
        const isNotCancelled = booking.status !== 'cancelled';
        
        return isFutureOrToday && isWithinRange && isNotCancelled;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [bookings, dateRange]);

  // Calculate totals
  const totals = useMemo(() => {
    let totalMinutes = 0;
    
    futureBookings.forEach(booking => {
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      const mins = (end.getTime() - start.getTime()) / (1000 * 60);
      if (mins > 0) totalMinutes += mins;
    });
    
    return {
      bookings: futureBookings.length,
      hours: (totalMinutes / 60).toFixed(1)
    };
  }, [futureBookings]);

  // Format duration
  const formatDuration = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const mins = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    
    if (mins < 0) return 'N/A';
    
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  // Handle PDF export
  const handleExportPDF = () => {
    if (!carerProfile || !dateRange.from || !dateRange.to) {
      toast.error("Unable to generate report", { description: "Please ensure you are logged in and date range is selected" });
      return;
    }

    if (futureBookings.length === 0) {
      toast.error("No bookings to export", { description: "There are no future bookings in the selected date range" });
      return;
    }

    try {
      const pdfBookings: FutureBookingData[] = futureBookings.map(booking => ({
        id: booking.id,
        date: format(new Date(booking.start_time), "yyyy-MM-dd"),
        startTime: format(new Date(booking.start_time), "HH:mm"),
        endTime: format(new Date(booking.end_time), "HH:mm"),
        clientName: booking.client_name || 'Unknown Client',
        clientAddress: booking.client_address || undefined,
        serviceName: booking.service_name || undefined,
        status: booking.status
      }));

      generateFutureBookingPlanPDF({
        carerName: `${carerProfile.first_name} ${carerProfile.last_name}`,
        branchName,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        bookings: pdfBookings
      });

      toast.success("PDF Report Generated", {
        description: `Downloaded schedule report with ${futureBookings.length} bookings`
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to generate PDF", { description: "Please try again" });
    }
  };

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!carerProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load carer profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selection */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
            <SelectTrigger className="w-[180px]">
              <CalendarDays className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="next_week">Next Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="next_month">Next Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {datePreset === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[220px]">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  {customDateRange?.from ? (
                    customDateRange.to ? (
                      <>
                        {format(customDateRange.from, "dd MMM")} - {format(customDateRange.to, "dd MMM yyyy")}
                      </>
                    ) : (
                      format(customDateRange.from, "dd MMM yyyy")
                    )
                  ) : (
                    "Pick custom dates"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={customDateRange?.from}
                  selected={customDateRange}
                  onSelect={setCustomDateRange}
                  numberOfMonths={2}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        <Button onClick={handleExportPDF} disabled={futureBookings.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.bookings}</div>
            <p className="text-xs text-muted-foreground">
              {dateRange.from && dateRange.to && (
                <>
                  {format(dateRange.from, "dd MMM")} - {format(dateRange.to, "dd MMM yyyy")}
                </>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Planned Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.hours} hours</div>
            <p className="text-xs text-muted-foreground">
              Across {totals.bookings} scheduled visits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : futureBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming bookings found for the selected date range
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Address</TableHead>
                    <TableHead className="hidden sm:table-cell">Service</TableHead>
                    <TableHead className="text-center">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {futureBookings.map(booking => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(booking.start_time), "EEE, dd MMM")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(booking.start_time), "HH:mm")} - {format(new Date(booking.end_time), "HH:mm")}
                      </TableCell>
                      <TableCell>{booking.client_name || 'Unknown'}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                        {booking.client_address || 'Address not available'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {booking.service_name || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {formatDuration(booking.start_time, booking.end_time)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
