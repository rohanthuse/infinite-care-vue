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
import { Loader2, AlertTriangle } from 'lucide-react';

interface BulkDeleteClientDocumentsDialogProps {
  documentCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export const BulkDeleteClientDocumentsDialog: React.FC<BulkDeleteClientDocumentsDialogProps> = ({
  documentCount,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertDialogTitle>Delete Selected Client Documents?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              You are about to permanently delete <strong>{documentCount}</strong> client document{documentCount > 1 ? 's' : ''}.
            </p>
            <p className="text-destructive font-medium">
              This action cannot be undone.
            </p>
            <p className="text-sm text-muted-foreground">
              The files will be removed from storage and all document records will be deleted from the database.
            </p>
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
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Documents'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
