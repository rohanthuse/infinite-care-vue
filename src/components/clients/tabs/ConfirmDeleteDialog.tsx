import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface SuspensionRecord {
  id: string;
  action: string;
  suspension_type?: string;
  reason?: string;
  effective_from: string;
  effective_until?: string;
}

interface ConfirmDeleteDialogProps {
  suspension: SuspensionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  suspension,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}) => {
  if (!suspension) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirm Deletion
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this suspension record?
          </p>
          
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Type:</span>{" "}
              <span className="capitalize">
                {suspension.suspension_type || "Not specified"}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Reason:</span>{" "}
              {suspension.reason || "Not specified"}
            </p>
          </div>
          
          {suspension.action === "suspend" && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Warning:</span> Deleting this 
                suspension will automatically set the client status back to Active.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};