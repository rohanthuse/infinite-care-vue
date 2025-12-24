import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { CheckCircle2, ArrowRight, Home, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface NextBooking {
  id: string;
  start_time: string;
  clients?: {
    first_name?: string;
    last_name?: string;
  };
}

interface VisitCompletionModalProps {
  isOpen: boolean;
  status: 'completing' | 'success' | 'error';
  completionStep: string;
  completionProgress: number;
  errorMessage?: string;
  nextBooking?: NextBooking | null;
  onGoToNextClient: () => void;
  onGoToDashboard: () => void;
  onRetry: () => void;
  onClose: () => void;
}

export const VisitCompletionModal: React.FC<VisitCompletionModalProps> = ({
  isOpen,
  status,
  completionStep,
  completionProgress,
  errorMessage,
  nextBooking,
  onGoToNextClient,
  onGoToDashboard,
  onRetry,
  onClose,
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);

  // Start countdown when success and next booking available
  useEffect(() => {
    if (status === 'success' && nextBooking) {
      setCountdown(10);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            onGoToNextClient();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [status, nextBooking, onGoToNextClient]);

  const getNextClientName = () => {
    if (!nextBooking?.clients) return 'Next Client';
    const { first_name, last_name } = nextBooking.clients;
    return `${first_name || ''} ${last_name || ''}`.trim() || 'Next Client';
  };

  const getNextClientTime = () => {
    if (!nextBooking?.start_time) return '';
    return format(new Date(nextBooking.start_time), 'h:mm a');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        {status === 'completing' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Completing Visit...
              </DialogTitle>
              <DialogDescription>
                Please wait while we save your visit data
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-4">
              <Progress value={completionProgress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                {completionStep}
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                Visit Completed Successfully!
              </DialogTitle>
              <DialogDescription>
                All visit data has been saved and the service report has been generated.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-4">
              {nextBooking ? (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-primary mb-2">Next Scheduled Visit</p>
                  <p className="text-lg font-semibold">{getNextClientName()}</p>
                  <p className="text-sm text-muted-foreground">at {getNextClientTime()}</p>
                  {countdown !== null && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Automatically going to next client in {countdown}s...
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    No more visits scheduled for today. Great work!
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {nextBooking && (
                <Button 
                  onClick={onGoToNextClient} 
                  className="flex-1 gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Go to Next Client
                </Button>
              )}
              <Button 
                variant={nextBooking ? "outline" : "default"}
                onClick={onGoToDashboard}
                className="flex-1 gap-2"
              >
                <Home className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
                Visit Completion Failed
              </DialogTitle>
              <DialogDescription>
                There was a problem completing the visit. Your data has been saved locally.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive">
                  {errorMessage || 'An unexpected error occurred. Please try again.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={onRetry}
                className="flex-1 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button 
                variant="outline"
                onClick={onGoToDashboard}
                className="flex-1 gap-2"
              >
                <Home className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
