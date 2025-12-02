import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Mail } from "lucide-react";
import { CarerDB } from "@/data/hooks/useBranchCarers";

interface SendInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carer: CarerDB | null;
  onConfirm: () => void;
  isLoading: boolean;
}

export function SendInvitationDialog({ open, onOpenChange, carer, onConfirm, isLoading }: SendInvitationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Send Invitation Email?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Do you want to send the welcome email to {carer?.first_name} {carer?.last_name}?
            <br /><br />
            The email will include:
            <ul className="list-disc list-inside mt-2 text-left">
              <li>Staff name and email</li>
              <li>Login credentials (password)</li>
              <li>Login URL</li>
              <li>Welcome message</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Email'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
