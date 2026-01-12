import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, Download, Clock, Users, Loader2, Mail, AlertCircle } from "lucide-react";
import { format, addDays, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter, parseISO } from "date-fns";
import { generateFutureBookingPlanPDF, generateFutureBookingPlanPDFAsBase64, FutureBookingData } from "@/services/futureBookingPdfGenerator";
import { Booking } from "../BookingTimeGrid";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Carer {
  id: string;
  name: string;
  email?: string;
}

interface FutureBookingPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookings: Booking[];
  carers: Carer[];
  branchName: string;
  branchId?: string;
}

type DateRangePreset = "this-week" | "next-week" | "this-month" | "next-month" | "custom";

// Force cleanup of any lingering modal/dropdown states
const forceUICleanup = () => {
  requestAnimationFrame(() => {
    document.body.style.removeProperty('pointer-events');
    document.documentElement.style.removeProperty('pointer-events');
    document.body.removeAttribute('data-scroll-locked');
    
    const root = document.getElementById('root');
    if (root) {
      root.removeAttribute('inert');
      root.removeAttribute('aria-hidden');
    }
    
    // Remove any stale closed dropdown portals
    const closedDropdowns = document.querySelectorAll(
      '[data-radix-dropdown-menu-content][data-state="closed"]'
    );
    closedDropdowns.forEach(el => el.remove());
  });
};

export function FutureBookingPlanDialog({
  open,
  onOpenChange,
  bookings,
  carers,
  branchName,
  branchId,
}: FutureBookingPlanDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [selectedCarerId, setSelectedCarerId] = useState<string>("");
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("this-week");
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(addDays(new Date(), 30));

  const today = new Date();

  // Clean up any lingering dropdown states when dialog opens
  useEffect(() => {
    if (open) {
      forceUICleanup();
    }
  }, [open]);

  // Enhanced onOpenChange handler with cleanup on close
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      // Force cleanup of any lingering modal states when closing
      forceUICleanup();
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  // Handle close auto focus to prevent focus issues
  const handleCloseAutoFocus = useCallback((e: Event) => {
    e.preventDefault();
    // Force focus back to main content
    const mainContent = document.querySelector('main');
    if (mainContent) {
      (mainContent as HTMLElement).focus();
    }
    // Extra cleanup after focus handling
    forceUICleanup();
  }, []);

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

  // Prepare booking data for PDF generation
  const prepareBookingData = (): FutureBookingData[] => {
    return filteredBookings.map((booking) => ({
      id: booking.id,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      clientName: booking.clientName || "Unknown Client",
      clientAddress: booking.location_address || booking.clientAddress || "Address not provided",
      serviceName: "General Care",
      status: booking.status || "scheduled",
    }));
  };

  const handleDownloadPDF = async () => {
    if (!selectedCarer || filteredBookings.length === 0) return;

    setIsGenerating(true);
    try {
      await generateFutureBookingPlanPDF({
        carerName: selectedCarer.name,
        branchName,
        branchId,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        bookings: prepareBookingData(),
      });

      toast.success("Carer Rota PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedCarer || filteredBookings.length === 0) return;

    // Check if carer has email
    if (!selectedCarer.email) {
      toast.error("This carer doesn't have a registered email address");
      return;
    }

    setIsSendingEmail(true);
    try {
      // Generate PDF as base64
      const { base64, fileName } = await generateFutureBookingPlanPDFAsBase64({
        carerName: selectedCarer.name,
        branchName,
        branchId,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        bookings: prepareBookingData(),
      });

      // Get sender name from current user
      const { data: { user } } = await supabase.auth.getUser();
      let senderName = "Administrator";
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile) {
          senderName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || "Administrator";
        }
      }

      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke('send-carer-rota-email', {
        body: {
          carerName: selectedCarer.name,
          carerEmail: selectedCarer.email,
          branchName,
          dateRange: {
            startDate: format(dateRange.from, 'yyyy-MM-dd'),
            endDate: format(dateRange.to, 'yyyy-MM-dd'),
          },
          bookingsCount: filteredBookings.length,
          totalHours: totalHours.toFixed(1),
          pdfBase64: base64,
          pdfFileName: fileName,
          senderName,
        },
      });

      if (error) throw error;

      toast.success(`Rota sent successfully to ${selectedCarer.email}`);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send rota email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const canSendEmail = selectedCarer && selectedCarer.email && filteredBookings.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Carer Rota
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
                      <span className="flex items-center gap-2">
                        {carer.name}
                        {!carer.email && (
                          <span className="text-xs text-muted-foreground">(no email)</span>
                        )}
                      </span>
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

          {/* Email Warning for missing email */}
          {selectedCarer && !selectedCarer.email && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Email unavailable - this carer has no registered email address</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="outline"
                      onClick={handleSendEmail}
                      disabled={!canSendEmail || isSendingEmail}
                    >
                      {isSendingEmail ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      {isSendingEmail ? "Sending..." : "Send via Email"}
                    </Button>
                  </span>
                </TooltipTrigger>
                {selectedCarer && !selectedCarer.email && (
                  <TooltipContent>
                    <p>This carer has no registered email address</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={handleDownloadPDF}
              disabled={!selectedCarerId || filteredBookings.length === 0 || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
