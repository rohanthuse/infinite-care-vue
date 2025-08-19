
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
      <Alert className="border-border bg-accent">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <AlertDescription className="text-foreground">
          <strong>Validating booking...</strong> Checking for conflicts in real-time.
        </AlertDescription>
      </Alert>
    );
  }

  if (validationError) {
    return (
      <Alert variant="destructive" className="animate-in slide-in-from-top-1 duration-300">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Carer Already Assigned:</strong> {validationError}
          {conflictCount > 0 && (
            <span className="block mt-2 text-sm font-medium">
              ⚠️ {conflictCount} conflicting appointment{conflictCount > 1 ? 's' : ''} found at this time.
            </span>
          )}
          <div className="mt-2 text-xs text-muted-foreground">
            Please select a different carer or modify the appointment time.
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isValid === true) {
    return (
      <Alert className="border-border bg-accent text-accent-foreground">
        <CheckCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-foreground">
          <strong>Validation Passed:</strong> No booking conflicts detected.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
