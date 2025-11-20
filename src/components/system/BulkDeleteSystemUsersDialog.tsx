import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BulkDeleteSystemUsersDialogProps {
  users: Array<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role?: string;
  }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const BulkDeleteSystemUsersDialog = ({
  users,
  open,
  onOpenChange,
  onConfirm,
}: BulkDeleteSystemUsersDialogProps) => {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmed = confirmText === "DELETE";

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText("");
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      setConfirmText("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {users.length} User{users.length > 1 ? 's' : ''}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the selected users and all their data.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Deleting these users will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Terminate all active sessions immediately</li>
                <li>Remove all roles and permissions</li>
                <li>Delete all organization assignments</li>
                <li>Permanently remove all user data</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div>
            <Label className="text-sm font-medium mb-2 block">Users to be deleted:</Label>
            <ScrollArea className="h-[200px] w-full rounded-md border border-border p-4">
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                    <Badge variant="outline">
                      {user.role === 'super_admin' ? 'Super Admin' :
                       user.role === 'tenant_manager' ? 'Tenant Manager' :
                       user.role === 'support_admin' ? 'Support Admin' :
                       'Analytics Viewer'}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <Label htmlFor="confirm-text" className="text-sm font-medium">
              Type <span className="font-bold text-destructive">DELETE</span> to confirm:
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mt-2"
              autoComplete="off"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Users
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
