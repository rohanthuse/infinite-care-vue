import React, { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, addMonths, parseISO, isWithinInterval } from "date-fns";
import { Calendar, Mail, Send, Clock, MapPin, User, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CarerBookingWithAddress {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  client_name?: string;
  client_address?: string;
  service_names?: string[];
}

interface SendCarerScheduleEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carerId: string;
  carerName: string;
  carerEmail: string;
  branchName: string;
  bookings: CarerBookingWithAddress[];
}

type DateRangePreset = "this_month" | "next_month" | "custom";

export function SendCarerScheduleEmailDialog({
  open,
  onOpenChange,
  carerId,
  carerName,
  carerEmail,
  branchName,
  bookings,
}: SendCarerScheduleEmailDialogProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [customSubject, setCustomSubject] = useState("");

  // Calculate date range based on preset
  const dateRange = useMemo(() => {
    const now = new Date();
    if (dateRangePreset === "this_month") {
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    } else if (dateRangePreset === "next_month") {
      const nextMonth = addMonths(now, 1);
      return {
        start: startOfMonth(nextMonth),
        end: endOfMonth(nextMonth),
      };
    } else {
      return {
        start: customStartDate ? parseISO(customStartDate) : startOfMonth(now),
        end: customEndDate ? parseISO(customEndDate) : endOfMonth(now),
      };
    }
  }, [dateRangePreset, customStartDate, customEndDate]);

  // Filter bookings by date range
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const bookingDate = parseISO(booking.start_time);
      return isWithinInterval(bookingDate, { start: dateRange.start, end: dateRange.end });
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [bookings, dateRange]);

  // Calculate total hours
  const totalMinutes = useMemo(() => {
    return filteredBookings.reduce((sum, booking) => {
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
  }, [filteredBookings]);

  const totalHours = (totalMinutes / 60).toFixed(1);

  const dateRangeDisplay = `${format(dateRange.start, "d MMMM yyyy")} - ${format(dateRange.end, "d MMMM yyyy")}`;

  const handleSendEmail = async () => {
    if (!carerEmail) {
      toast({
        title: "Email Required",
        description: "The carer does not have an email address configured.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      // Format bookings for the email
      const formattedBookings = filteredBookings.map((booking) => {
        const startDate = new Date(booking.start_time);
        const endDate = new Date(booking.end_time);
        const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

        return {
          date: format(startDate, "EEE, d MMM yyyy"),
          time: `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`,
          clientName: booking.client_name || "Unknown Client",
          clientAddress: booking.client_address || "No address available",
          services: booking.service_names || [],
          duration: durationMinutes,
          status: booking.status || "assigned",
        };
      });

      // Get current user's name for sender
      const { data: { user } } = await supabase.auth.getUser();
      let senderName = "Branch Admin";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();
        if (profile) {
          senderName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Branch Admin";
        }
      }

      const { data, error } = await supabase.functions.invoke("send-carer-schedule", {
        body: {
          carerName,
          carerEmail,
          branchName,
          dateRange: {
            startDate: dateRange.start.toISOString(),
            endDate: dateRange.end.toISOString(),
          },
          bookings: formattedBookings,
          senderName,
        },
      });

      if (error) throw error;

      toast({
        title: "Schedule Sent",
        description: `Booking schedule has been emailed to ${carerName}.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending schedule email:", error);
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send the schedule email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Booking Schedule
          </DialogTitle>
          <DialogDescription>
            Send booking schedule to <strong>{carerName}</strong> ({carerEmail || "No email"})
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Date Range Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={dateRangePreset === "this_month" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRangePreset("this_month")}
              >
                This Month
              </Button>
              <Button
                type="button"
                variant={dateRangePreset === "next_month" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRangePreset("next_month")}
              >
                Next Month
              </Button>
              <Button
                type="button"
                variant={dateRangePreset === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRangePreset("custom")}
              >
                Custom Range
              </Button>
            </div>

            {dateRangePreset === "custom" && (
              <div className="flex gap-4 mt-2">
                <div className="flex-1">
                  <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 inline mr-1" />
              {dateRangeDisplay}
            </p>
          </div>

          {/* Schedule Preview */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Schedule Preview</Label>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-semibold text-primary">{filteredBookings.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-semibold text-primary">{totalHours}h</p>
                </div>
              </div>

              {filteredBookings.length > 0 ? (
                <ScrollArea className="h-48 border rounded-md bg-background">
                  <div className="p-3 space-y-2">
                    {filteredBookings.slice(0, 10).map((booking) => {
                      const startDate = new Date(booking.start_time);
                      const endDate = new Date(booking.end_time);
                      const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
                      const hours = Math.floor(durationMinutes / 60);
                      const mins = durationMinutes % 60;
                      const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;

                      return (
                        <div
                          key={booking.id}
                          className="flex items-start gap-3 p-2 rounded-md bg-muted/30 text-sm"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">
                                {format(startDate, "EEE, d MMM")} · {format(startDate, "h:mm a")}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {durationStr}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{booking.client_name || "Unknown Client"}</span>
                            </div>
                            {booking.client_address && (
                              <div className="flex items-center gap-2 text-muted-foreground text-xs mt-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{booking.client_address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {filteredBookings.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        ... and {filteredBookings.length - 10} more bookings
                      </p>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-24 border rounded-md bg-background flex items-center justify-center">
                  <p className="text-muted-foreground">No bookings found for this date range</p>
                </div>
              )}
            </div>
          </div>

          {/* Custom Subject (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Custom Subject <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="subject"
              placeholder={`Your Booking Schedule - ${dateRangeDisplay}`}
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSendEmail} disabled={isSending || !carerEmail}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
