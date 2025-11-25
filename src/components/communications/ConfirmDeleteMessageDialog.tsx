import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmDeleteMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  deleteType: 'message' | 'thread';
  messagePreview?: string;
}

export const ConfirmDeleteMessageDialog: React.FC<ConfirmDeleteMessageDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  deleteType,
  messagePreview
}) => {
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      // Ensure focus returns properly and cleanup pointer-events
      requestAnimationFrame(() => {
        document.body.style.removeProperty('pointer-events');
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            {deleteType === 'message' 
              ? 'Are you sure you want to delete this message?'
              : 'Are you sure you want to delete this entire conversation?'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {messagePreview && (
            <div className="bg-muted p-3 rounded-lg max-h-32 overflow-y-auto">
              <p className="text-sm text-muted-foreground line-clamp-4">
                {messagePreview}
              </p>
            </div>
          )}
          
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Note:</span> This {deleteType} will be removed from 
              all participants' view and cannot be recovered.
            </p>
          </div>
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
            <Trash2 className="h-4 w-4 mr-2" />
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
