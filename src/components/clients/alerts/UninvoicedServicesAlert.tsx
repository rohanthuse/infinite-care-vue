
import React from "react";
import { AlertTriangle, Clock, PoundSterling } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UninvoicedBooking } from "@/hooks/useEnhancedClientBilling";
import { format, parseISO, isValid } from "date-fns";

interface UninvoicedServicesAlertProps {
  uninvoicedBookings: UninvoicedBooking[];
  onCreateInvoice: () => void;
}

const formatDateSafe = (dateValue: any): string => {
  if (!dateValue) return "N/A";
  
  try {
    const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
    if (!isValid(date)) return "N/A";
    return format(date, 'MMM dd, yyyy');
  } catch {
    return "N/A";
  }
};

export function UninvoicedServicesAlert({ uninvoicedBookings, onCreateInvoice }: UninvoicedServicesAlertProps) {
  if (uninvoicedBookings.length === 0) return null;

  const totalUninvoicedAmount = uninvoicedBookings.reduce((sum, booking) => sum + (booking.revenue || 0), 0);

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Uninvoiced Services Detected</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p className="text-orange-700">
            There are <strong>{uninvoicedBookings.length}</strong> completed services that haven't been invoiced yet, 
            totaling <strong>${totalUninvoicedAmount.toFixed(2)}</strong>.
          </p>
          
          <div className="grid gap-2 max-h-40 overflow-y-auto">
            {uninvoicedBookings.map((booking) => (
              <Card key={booking.booking_id} className="bg-white border border-orange-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{booking.service_title}</span>
                        <span className="text-xs text-gray-500">
                          • {formatDateSafe(booking.end_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <PoundSterling className="h-3 w-3" />
                          <span>${(booking.revenue || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>{booking.days_since_service || 0} days ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={onCreateInvoice} className="bg-orange-600 hover:bg-orange-700">
              Create Invoice
            </Button>
            <Button size="sm" variant="outline" className="text-orange-700 border-orange-300">
              Review All Services
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
