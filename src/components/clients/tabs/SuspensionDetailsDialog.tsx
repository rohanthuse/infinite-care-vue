import React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SuspensionRecord {
  id: string;
  action: string;
  suspension_type?: string;
  reason?: string;
  details?: string;
  effective_from: string;
  effective_until?: string;
  created_at: string;
  apply_to?: any;
  notify?: any;
  attachments?: any[];
}

interface SuspensionDetailsDialogProps {
  suspension: SuspensionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SuspensionDetailsDialog: React.FC<SuspensionDetailsDialogProps> = ({
  suspension,
  open,
  onOpenChange,
}) => {
  if (!suspension) return null;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  const getStatusBadge = (action: string) => {
    switch (action) {
      case "suspend":
        return <Badge variant="destructive">Suspended</Badge>;
      case "resume":
        return <Badge variant="default">Resumed</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Suspension Details
            {getStatusBadge(suspension.action)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Type
              </label>
              <p className="text-sm capitalize">
                {suspension.suspension_type || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Reason
              </label>
              <p className="text-sm">{suspension.reason || "Not specified"}</p>
            </div>
          </div>

          {/* Date Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                From Date
              </label>
              <p className="text-sm">{formatDate(suspension.effective_from)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Until Date
              </label>
              <p className="text-sm">
                {suspension.effective_until
                  ? formatDate(suspension.effective_until)
                  : "Indefinite"}
              </p>
            </div>
          </div>

          {/* Description */}
          {suspension.details && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Description
              </label>
              <p className="text-sm mt-1">{suspension.details}</p>
            </div>
          )}

          <Separator />

          {/* Created Information */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Created At
            </label>
            <p className="text-sm">{formatDate(suspension.created_at)}</p>
          </div>

          {/* Apply To Information (if available) */}
          {suspension.apply_to && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Applied To
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {suspension.apply_to.visits && (
                  <Badge variant="outline">Visits</Badge>
                )}
                {suspension.apply_to.serviceActions && (
                  <Badge variant="outline">Service Actions</Badge>
                )}
                {suspension.apply_to.billing && (
                  <Badge variant="outline">Billing</Badge>
                )}
                {suspension.apply_to.messaging && (
                  <Badge variant="outline">Messaging</Badge>
                )}
              </div>
            </div>
          )}

          {/* Attachments (if any) */}
          {suspension.attachments && suspension.attachments.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Attachments
              </label>
              <div className="space-y-1 mt-1">
                {suspension.attachments.map((attachment: any, index: number) => (
                  <p key={index} className="text-sm">
                    {attachment.name} ({attachment.size} bytes)
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};