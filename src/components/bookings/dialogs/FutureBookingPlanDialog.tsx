import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Download, Clock, Users } from "lucide-react";
import { format, addDays, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter, parseISO } from "date-fns";
import { generateFutureBookingPlanPDF, FutureBookingData } from "@/services/futureBookingPdfGenerator";
import { Booking } from "../BookingTimeGrid";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

interface Carer {
  id: string;
  name: string;
}

interface FutureBookingPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookings: Booking[];
  carers: Carer[];
  branchName: string;
}

type DateRangePreset = "this-week" | "next-week" | "this-month" | "next-month" | "custom";

export function FutureBookingPlanDialog({
  open,
  onOpenChange,
  bookings,
  carers,
  branchName,
}: FutureBookingPlanDialogProps) {
  const [selectedCarerId, setSelectedCarerId] = useState<string>("");
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("this-week");
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(addDays(new Date(), 30));

  const today = new Date();

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (dateRangePreset) {
      case "this-week":
        return {
          from: startOfWeek(now, { weekStartsOn: 1 }),
          to: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case "next-week":
        const nextWeekStart = addDays(startOfWeek(now, { weekStartsOn: 1 }), 7);
        return {
          from: nextWeekStart,
          to: endOfWeek(nextWeekStart, { weekStartsOn: 1 }),
        };
      case "this-month":
        return {
          from: startOfMonth(now),
          to: endOfMonth(now),
        };
      case "next-month":
        const nextMonthStart = addMonths(startOfMonth(now), 1);
        return {
          from: nextMonthStart,
          to: endOfMonth(nextMonthStart),
        };
      case "custom":
        return {
          from: customStartDate,
          to: customEndDate,
        };
      default:
        return {
          from: now,
          to: addDays(now, 7),
        };
    }
  }, [dateRangePreset, customStartDate, customEndDate]);

  const filteredBookings = useMemo(() => {
    if (!selectedCarerId) return [];

    return bookings.filter((booking) => {
      // Must be assigned to selected carer
      if (booking.carerId !== selectedCarerId) return false;

      // Must be a future booking (from today onwards)
      const bookingDate = parseISO(booking.date);
      
      if (!isAfter(bookingDate, addDays(today, -1))) return false;

      // Must be within selected date range
      if (bookingDate < dateRange.from || bookingDate > dateRange.to) return false;

      // Exclude cancelled bookings
      if (booking.status === "cancelled") return false;

      return true;
    }).sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [bookings, selectedCarerId, dateRange, today]);

  const totalHours = useMemo(() => {
    return filteredBookings.reduce((total, booking) => {
      // Parse time strings like "09:00" and "11:00"
      const [startHour, startMin] = booking.startTime.split(':').map(Number);
      const [endHour, endMin] = booking.endTime.split(':').map(Number);
      const hours = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
      return total + hours;
    }, 0);
  }, [filteredBookings]);

  const selectedCarer = carers.find((c) => c.id === selectedCarerId);

  const handleDownloadPDF = () => {
    if (!selectedCarer || filteredBookings.length === 0) return;

    const bookingData: FutureBookingData[] = filteredBookings.map((booking) => {
      return {
        id: booking.id,
        date: booking.date, // Keep as ISO format for PDF generator to parse
        startTime: booking.startTime,
        endTime: booking.endTime,
        clientName: booking.clientName || "Unknown Client",
        clientAddress: booking.location_address || booking.clientAddress || "Address not provided",
        serviceName: "General Care",
        status: booking.status || "scheduled",
      };
    });

    generateFutureBookingPlanPDF({
      carerName: selectedCarer.name,
      branchName,
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
      bookings: bookingData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Future Booking Plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Carer</label>
              <Select value={selectedCarerId} onValueChange={setSelectedCarerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a carer..." />
                </SelectTrigger>
                <SelectContent>
                  {carers.map((carer) => (
                    <SelectItem key={carer.id} value={carer.id}>
                      {carer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select
                value={dateRangePreset}
                onValueChange={(v) => setDateRangePreset(v as DateRangePreset)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="next-week">Next Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="next-month">Next Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range Pickers */}
          {dateRangePreset === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <EnhancedDatePicker
                  value={customStartDate}
                  onChange={(date) => date && setCustomStartDate(date)}
                  placeholder="Select start date"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <EnhancedDatePicker
                  value={customEndDate}
                  onChange={(date) => date && setCustomEndDate(date)}
                  placeholder="Select end date"
                  disabled={(date) => date < customStartDate}
                />
              </div>
            </div>
          )}

          {/* Date Range Display */}
          <div className="text-sm text-muted-foreground">
            Showing bookings from{" "}
            <span className="font-medium text-foreground">
              {format(dateRange.from, "d MMM yyyy")}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {format(dateRange.to, "d MMM yyyy")}
            </span>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{filteredBookings.length}</p>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
                    <p className="text-sm text-muted-foreground">Planned Hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings Preview Table */}
          {selectedCarerId ? (
            filteredBookings.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Service</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.slice(0, 10).map((booking) => {
                      const bookingDate = parseISO(booking.date);

                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {format(bookingDate, "EEE, d MMM")}
                          </TableCell>
                          <TableCell>
                            {booking.startTime} - {booking.endTime}
                          </TableCell>
                          <TableCell>{booking.clientName || "Unknown"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {booking.location_address || booking.clientAddress || "—"}
                          </TableCell>
                          <TableCell>General Care</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {filteredBookings.length > 10 && (
                  <div className="p-3 text-center text-sm text-muted-foreground border-t">
                    Showing 10 of {filteredBookings.length} bookings. Download PDF for full list.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No future bookings found for this carer in the selected date range.
              </div>
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Please select a carer to view their future bookings.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={!selectedCarerId || filteredBookings.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
