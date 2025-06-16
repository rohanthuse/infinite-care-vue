
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface BookingValidationAlertProps {
  isValidating: boolean;
  validationError?: string;
  isValid?: boolean;
  conflictCount?: number;
}

export function BookingValidationAlert({
  isValidating,
  validationError,
  isValid,
  conflictCount = 0
}: BookingValidationAlertProps) {
  if (isValidating) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Validating booking...</strong> Checking for conflicts in real-time.
        </AlertDescription>
      </Alert>
    );
  }

  if (validationError) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Booking Blocked:</strong> {validationError}
          {conflictCount > 0 && (
            <span className="block mt-1 text-sm">
              {conflictCount} conflicting appointment{conflictCount > 1 ? 's' : ''} detected.
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isValid === true) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Validation Passed:</strong> No booking conflicts detected.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
