import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, Info, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ValidationWarning {
  type: 'overlap' | 'missing_staff' | 'missing_service' | 'unusual_duration' | 'rate_gap' | 'bank_holiday';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedBookings?: string[];
  clientName?: string;
}

interface ValidationWarningsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  warnings: ValidationWarning[];
  canProceed: boolean;
}

export const ValidationWarningsDialog: React.FC<ValidationWarningsDialogProps> = ({
  isOpen,
  onClose,
  onProceed,
  warnings,
  canProceed,
}) => {
  const getSeverityIcon = (severity: ValidationWarning['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: ValidationWarning['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
    }
  };

  const groupedWarnings = warnings.reduce((acc, warning) => {
    if (!acc[warning.severity]) {
      acc[warning.severity] = [];
    }
    acc[warning.severity].push(warning);
    return acc;
  }, {} as Record<string, ValidationWarning[]>);

  const severityOrder: ValidationWarning['severity'][] = ['critical', 'high', 'medium', 'low'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            Validation Warnings Detected
          </DialogTitle>
          <DialogDescription>
            {canProceed 
              ? 'The following issues were found but invoice generation can proceed. Review them carefully before continuing.'
              : 'Critical issues must be resolved before invoice generation can proceed.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {severityOrder.map((severity) => {
            const severityWarnings = groupedWarnings[severity];
            if (!severityWarnings || severityWarnings.length === 0) return null;

            return (
              <div key={severity}>
                <div className="flex items-center gap-2 mb-3">
                  {getSeverityIcon(severity)}
                  <h3 className="font-semibold capitalize">
                    {severity} Issues ({severityWarnings.length})
                  </h3>
                </div>

                <div className="space-y-2">
                  {severityWarnings.map((warning, index) => (
                    <Alert key={index} className="border-l-4" style={{ borderLeftColor: getSeverityColor(severity) }}>
                      <AlertDescription>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {warning.clientName && (
                              <p className="font-medium mb-1">Client: {warning.clientName}</p>
                            )}
                            <p>{warning.message}</p>
                            {warning.affectedBookings && warning.affectedBookings.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Affected bookings: {warning.affectedBookings.length}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {warning.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {canProceed && (
            <Button onClick={onProceed}>
              Proceed with Generation
            </Button>
          )}
          {!canProceed && (
            <Button variant="destructive" disabled>
              Cannot Proceed - Fix Critical Issues
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
