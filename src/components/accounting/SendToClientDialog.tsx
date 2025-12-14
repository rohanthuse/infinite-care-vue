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
import { Send, Loader2 } from 'lucide-react';

interface SendToClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  invoiceNumber?: string;
  isResend?: boolean;
}

export const SendToClientDialog: React.FC<SendToClientDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  invoiceNumber,
  isResend = false,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {isResend ? 'Resend Invoice to Client' : 'Send Invoice to Client'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              {isResend 
                ? `Are you sure you want to resend invoice ${invoiceNumber || ''} to the client portal?`
                : `Are you sure you want to send invoice ${invoiceNumber || ''} to the client portal?`
              }
            </p>
            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-medium text-foreground mb-1">What happens next:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>The invoice will be visible on the client's portal</li>
                <li>The client can view invoice details and make payments</li>
                <li>Invoice status will change to "Sent"</li>
              </ul>
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
            disabled={isLoading}
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
