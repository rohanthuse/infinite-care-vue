
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, User, AlertTriangle, Ban, Shield, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConflictingBooking {
  id: string;
  clientName: string;
  startTime: string;
  endTime: string;
  date: string;
}

interface BookingOverlapAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictingBookings: ConflictingBooking[];
  carerName: string;
  proposedTime: string;
  proposedDate: string;
  availableCarers: Array<{ id: string; name: string; initials: string }>;
  onChooseDifferentCarer: () => void;
  onModifyTime: () => void;
  onProceedWithoutCarer?: () => void;
}

export function BookingOverlapAlert({
  open,
  onOpenChange,
  conflictingBookings,
  carerName,
  proposedTime,
  proposedDate,
  availableCarers,
  onChooseDifferentCarer,
  onModifyTime,
  onProceedWithoutCarer,
}: BookingOverlapAlertProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-600" />
            <AlertDialogTitle className="text-red-900">Critical Booking Conflict</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 font-medium">
                  <strong>SAVE BLOCKED:</strong> <strong>{carerName}</strong> has conflicting appointments on{" "}
                  <strong>{(() => {
                    // Simple date formatting without timezone conversion
                    const dateStr = proposedDate.includes('T') ? proposedDate.split('T')[0] : proposedDate;
                    const [year, month, day] = dateStr.split('-');
                    return `${month}/${day}/${year}`;
                  })()}</strong> at{" "}
                  <strong>{proposedTime}</strong>.
                </p>
                <p className="text-red-700 text-sm mt-2">
                  Even 1-minute overlaps are blocked to ensure proper scheduling and prevent conflicts.
                </p>
              </div>
              
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center text-red-700">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Conflicting Bookings ({conflictingBookings.length}):
                  </h4>
                  {conflictingBookings.map((booking, index) => (
                    <div key={booking.id || index} className="border rounded-lg p-3 bg-red-50 border-red-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-900">{booking.clientName}</span>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Conflict
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-700">
                        <Clock className="h-3 w-3" />
                        {booking.startTime} - {booking.endTime} (existing booking)
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Date: {(() => {
                          const dateStr = booking.date.includes('T') ? booking.date.split('T')[0] : booking.date;
                          const [year, month, day] = dateStr.split('-');
                          return `${month}/${day}/${year}`;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>

              {availableCarers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-green-700">
                    Available Carers for this time slot:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {availableCarers.slice(0, 3).map((carer) => (
                      <Badge key={carer.id} variant="outline" className="text-xs border-green-300 text-green-700">
                        {carer.name}
                      </Badge>
                    ))}
                    {availableCarers.length > 3 && (
                      <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                        +{availableCarers.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-900 text-sm mb-2">How to resolve:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Choose a different carer who is available</li>
                  <li>• Modify the booking time to avoid conflicts</li>
                  <li>• Create booking without carer (assign later)</li>
                  <li>• Cancel this booking attempt</li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <div className="flex gap-2 w-full">
            <AlertDialogAction
              onClick={onChooseDifferentCarer}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Choose Different Carer
            </AlertDialogAction>
            <AlertDialogAction
              onClick={onModifyTime}
              className="flex-1 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
              Modify Time
            </AlertDialogAction>
          </div>
          
          {onProceedWithoutCarer && (
            <AlertDialogAction
              onClick={onProceedWithoutCarer}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              <UserX className="h-4 w-4 mr-2" />
              Save Without Carer
            </AlertDialogAction>
          )}
          
          <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
