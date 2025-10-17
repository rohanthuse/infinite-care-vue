import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import type { BulkGenerationProgress } from "@/hooks/useBulkInvoiceGeneration";

interface BulkGenerationProgressDialogProps {
  isOpen: boolean;
  progress: BulkGenerationProgress;
}

export const BulkGenerationProgressDialog: React.FC<BulkGenerationProgressDialogProps> = ({
  isOpen,
  progress,
}) => {
  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Generating Invoices...
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Progress value={percentage} className="w-full" />
          
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">
              Processing {progress.current} of {progress.total} clients
            </p>
            
            {progress.currentClient && (
              <p className="text-sm text-muted-foreground">
                Current: {progress.currentClient}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              Please wait while we generate the invoices...
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
