
import React from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useControlledDialog } from "@/hooks/useDialogManager";
import { ClientNote } from "@/hooks/useClientNotes";

interface DeleteNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  note: ClientNote | null;
}

export function DeleteNoteDialog({ open, onOpenChange, onConfirm, note }: DeleteNoteDialogProps) {
  const dialogId = `delete-note-${note?.id || 'unknown'}`;
  const controlledDialog = useControlledDialog(dialogId, open);
  
  // Sync with external props
  React.useEffect(() => {
    if (open !== controlledDialog.open) {
      controlledDialog.onOpenChange(open);
    }
  }, [open, controlledDialog.open, controlledDialog.onOpenChange]);
  
  React.useEffect(() => {
    onOpenChange(controlledDialog.open);
  }, [controlledDialog.open, onOpenChange]);

  if (!note) return null;

  return (
    <AlertDialog open={controlledDialog.open} onOpenChange={controlledDialog.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Note
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the note "{note.title}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Note
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
