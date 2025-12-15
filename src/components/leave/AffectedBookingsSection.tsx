import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, RefreshCw, XCircle, CheckCircle2, Loader2 } from "lucide-react";
import { AffectedBooking } from "@/hooks/useLeaveBookingConflicts";

interface AffectedBookingsSectionProps {
  affectedBookings: AffectedBooking[];
  resolvedBookingIds: Set<string>;
  isLoading: boolean;
  onReassign: (booking: AffectedBooking) => void;
  onCancel: (booking: AffectedBooking) => void;
}

export function AffectedBookingsSection({
  affectedBookings,
  resolvedBookingIds,
  isLoading,
  onReassign,
  onCancel
}: AffectedBookingsSectionProps) {
  if (isLoading) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-orange-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking for booking conflicts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (affectedBookings.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">No booking conflicts found</span>
          </div>
          <p className="text-sm text-green-600 mt-1 ml-7">
            This carer has no bookings scheduled during the requested leave period.
          </p>
        </CardContent>
      </Card>
    );
  }

  const unresolvedCount = affectedBookings.filter(b => !resolvedBookingIds.has(b.id)).length;
  const resolvedCount = resolvedBookingIds.size;

  return (
    <Card className="border-orange-300 bg-orange-50/50">
      <CardContent className="p-4 space-y-4">
        {/* Warning Header */}
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-orange-800">
              Affected Bookings ({affectedBookings.length} conflicts)
            </h4>
            <p className="text-sm text-orange-700 mt-1">
              This leave request conflicts with existing bookings. Please resolve all conflicts before approving.
            </p>
            {resolvedCount > 0 && (
              <p className="text-sm text-green-700 mt-1 font-medium">
                ✓ {resolvedCount} of {affectedBookings.length} conflicts resolved
              </p>
            )}
          </div>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto rounded-md border border-orange-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-orange-100/50">
                <TableHead className="text-orange-900">Client</TableHead>
                <TableHead className="text-orange-900">Date</TableHead>
                <TableHead className="text-orange-900">Time</TableHead>
                <TableHead className="text-orange-900">Service</TableHead>
                <TableHead className="text-orange-900">Status</TableHead>
                <TableHead className="text-orange-900 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affectedBookings.map((booking) => {
                const isResolved = resolvedBookingIds.has(booking.id);
                return (
                  <TableRow 
                    key={booking.id}
                    className={isResolved ? "bg-green-50" : "bg-red-50/30"}
                  >
                    <TableCell className="font-medium">
                      {booking.client_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!isResolved && (
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                        )}
                        {isResolved && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        <span className={isResolved ? "text-green-700" : ""}>
                          {booking.formatted_date}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{booking.scheduled_time}</TableCell>
                    <TableCell>
                      {booking.service_name || (
                        <span className="text-muted-foreground">No service</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isResolved ? (
                        <Badge variant="custom" className="bg-green-100 text-green-800 border-green-200">
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="custom" className="bg-orange-100 text-orange-800 border-orange-200">
                          {booking.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isResolved && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReassign(booking)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reassign
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onCancel(booking)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Resolution Progress */}
        {unresolvedCount > 0 && (
          <div className="flex items-center gap-2 p-3 bg-red-100 rounded-md border border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800 font-medium">
              Please resolve {unresolvedCount} remaining conflict{unresolvedCount !== 1 ? 's' : ''} before approving
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
