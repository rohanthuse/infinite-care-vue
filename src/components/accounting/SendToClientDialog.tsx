import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, AlertTriangle } from 'lucide-react';
import { servicePayerLabels, type ServicePayerConfig } from '@/hooks/useClientServicePayer';

interface SendToClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  invoiceNumber?: string;
  isResend?: boolean;
  // Validation and display props
  clientName?: string;
  clientId?: string;
  billToType?: 'private' | 'authority' | null;
  servicePayerConfig?: ServicePayerConfig | null;
}

export const SendToClientDialog: React.FC<SendToClientDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  invoiceNumber,
  isResend = false,
  clientName,
  clientId,
  billToType,
  servicePayerConfig,
}) => {
  const canProceed = servicePayerConfig?.canProceed ?? true;
  const servicePayer = servicePayerConfig?.servicePayer;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {isResend ? 'Resend Invoice to Client' : 'Send Invoice to Client'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3" asChild>
            <div>
              {/* Validation Error - Block if service payer not configured */}
              {!canProceed && clientId && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Cannot Send Invoice</AlertTitle>
                  <AlertDescription>
                    {servicePayerConfig?.errorMessage}
                    <br />
                    <span className="text-xs mt-1 block">
                      Please configure this in Client → General → Accounting Settings
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Invoice Details - Show when validation passes */}
              {canProceed && clientName && (
                <div className="bg-muted p-4 rounded-md space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Invoice:</span>
                    <span className="font-medium text-foreground">{invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Client:</span>
                    <span className="font-medium text-foreground">{clientName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Bill To:</span>
                    <Badge variant={billToType === 'authority' ? 'default' : 'secondary'}>
                      {billToType === 'authority' ? 'Authority' : 'Client (Private)'}
                    </Badge>
                  </div>
                  {servicePayer && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Who Pays:</span>
                      <Badge variant="outline">
                        {servicePayerLabels[servicePayer] || servicePayer}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Fallback for legacy calls without full data */}
              {canProceed && !clientName && (
                <p>
                  {isResend 
                    ? `Are you sure you want to resend invoice ${invoiceNumber || ''} to the client portal?`
                    : `Are you sure you want to send invoice ${invoiceNumber || ''} to the client portal?`
                  }
                </p>
              )}

              {canProceed && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p className="font-medium text-foreground mb-1">What happens next:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>The invoice will be visible on the client's portal</li>
                    <li>The client can view invoice details and make payments</li>
                    <li>Invoice status will change to "Sent"</li>
                  </ul>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading || !canProceed}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {isResend ? 'Resend to Client' : 'Send to Client'}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
