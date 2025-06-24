
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  document: any;
}

export function DeleteDocumentDialog({
  open,
  onOpenChange,
  onConfirm,
  document,
}: DeleteDocumentDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle>Delete Document</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete "{document?.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleConfirm}
          >
            Delete Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
