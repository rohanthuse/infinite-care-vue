
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
import { Clock, User, AlertTriangle } from "lucide-react";
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
  onForceCreate?: () => void;
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
  onForceCreate,
}: BookingOverlapAlertProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertDialogTitle>Booking Conflict Detected</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                The selected carer <strong>{carerName}</strong> has conflicting bookings on{" "}
                <strong>{new Date(proposedDate).toLocaleDateString()}</strong> at{" "}
                <strong>{proposedTime}</strong>.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Conflicting Bookings:</h4>
                {conflictingBookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-3 bg-red-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">{booking.clientName}</span>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Conflict
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      {booking.startTime} - {booking.endTime}
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
                      <Badge key={carer.id} variant="outline" className="text-xs">
                        {carer.name}
                      </Badge>
                    ))}
                    {availableCarers.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{availableCarers.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
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
          
          {onForceCreate && (
            <AlertDialogAction
              onClick={onForceCreate}
              className="w-full text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Force Create (Not Recommended)
            </AlertDialogAction>
          )}
          
          <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
