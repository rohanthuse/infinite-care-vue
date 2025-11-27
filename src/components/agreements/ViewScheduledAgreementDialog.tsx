import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, FileText, Clock, AlertCircle } from 'lucide-react';
import { ScheduledAgreement } from '@/types/agreements';
import { format } from 'date-fns';
import { useConvertScheduledAgreement } from '@/hooks/useConvertScheduledAgreement';
import { toast } from 'sonner';

type ViewScheduledAgreementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreement: ScheduledAgreement | null;
};

export function ViewScheduledAgreementDialog({
  open,
  onOpenChange,
  agreement,
}: ViewScheduledAgreementDialogProps) {
  const convertMutation = useConvertScheduledAgreement();

  if (!agreement) return null;

  const handleStartSigning = async () => {
    try {
      await convertMutation.mutateAsync(agreement.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to start signing process:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Upcoming': { className: 'bg-green-500/10 text-green-500' },
      'Pending Approval': { className: 'bg-blue-500/10 text-blue-500' },
      'Under Review': { className: 'bg-yellow-500/10 text-yellow-500' },
      'Completed': { className: 'bg-gray-500/10 text-gray-500' },
      'Cancelled': { className: 'bg-red-500/10 text-red-500' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Upcoming'];
    return (
      <Badge className={config.className}>
        {status}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl">{agreement.title}</DialogTitle>
              <DialogDescription>
                Scheduled agreement details
              </DialogDescription>
            </div>
            {getStatusBadge(agreement.status)}
          </div>
        </DialogHeader>

        <Separator />

        <div className="space-y-6">
          {/* Agreement Type */}
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Agreement Type</p>
              <p className="text-base">{agreement.agreement_types?.name || 'Not specified'}</p>
            </div>
          </div>

          {/* Scheduled With */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Scheduled With</p>
              <p className="text-base">{agreement.scheduled_with_name || 'Not assigned'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {agreement.scheduled_with_client_id ? 'Client' : agreement.scheduled_with_staff_id ? 'Staff' : 'Unassigned'}
              </p>
            </div>
          </div>

          {/* Scheduled Date */}
          {agreement.scheduled_for && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled For</p>
                <p className="text-base">{format(new Date(agreement.scheduled_for), 'EEEE, MMMM dd, yyyy')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(agreement.scheduled_for), 'hh:mm a')}
                </p>
              </div>
            </div>
          )}

          {/* Created Date */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created On</p>
              <p className="text-base">{format(new Date(agreement.created_at), 'MMM dd, yyyy')}</p>
            </div>
          </div>

          {/* Notes */}
          {agreement.notes && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{agreement.notes}</p>
              </div>
            </div>
          )}

          {/* Template Info */}
          {agreement.template_id && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                This agreement is generated from a template and will be personalized when signing starts.
              </p>
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {agreement.status === 'Upcoming' && (
            <Button 
              onClick={handleStartSigning}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending ? 'Processing...' : 'Start Signing Process'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
