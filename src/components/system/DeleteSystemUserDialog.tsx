import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeleteSystemUser } from '@/hooks/useSystemUsers';

interface DeleteSystemUserDialogProps {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteSystemUserDialog: React.FC<DeleteSystemUserDialogProps> = ({
  user,
  open,
  onOpenChange,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const { mutate: deleteUser, isPending } = useDeleteSystemUser();
  
  const userFullName = `${user.first_name} ${user.last_name}`.trim();
  const confirmationText = user.email;
  const isConfirmationValid = confirmText === confirmationText;
  
  const handleDelete = () => {
    if (!isConfirmationValid) return;
    
    deleteUser(
      { userId: user.id },
      {
        onSettled: () => {
          // Close dialog after mutation completes (success or error)
          // Small delay ensures refetch has started and UI is ready
          setTimeout(() => {
            onOpenChange(false);
            setConfirmText('');
          }, 150);
        },
      }
    );
  };

  const handleCancel = () => {
    onOpenChange(false);
    setConfirmText('');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Tenant User
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-left">
            <p>
              You are about to permanently delete the tenant user:
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-semibold">{userFullName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">Role: {user.role}</p>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-2">
                ⚠️ This action cannot be undone!
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>All user sessions will be terminated</li>
                <li>User roles and permissions will be removed</li>
                <li>Organisation assignments will be deleted</li>
                <li>User data will be permanently deleted</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-email" className="text-sm font-medium">
                Type the user's email to confirm deletion:
              </Label>
              <Input
                id="confirm-email"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={confirmationText}
                disabled={isPending}
                className="font-mono text-sm"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmationValid || isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete User
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};