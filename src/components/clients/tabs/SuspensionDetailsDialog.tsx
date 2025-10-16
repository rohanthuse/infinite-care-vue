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
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X, AlertCircle } from "lucide-react";

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

  const isActiveSuspension = (effectiveFrom: string, effectiveUntil?: string) => {
    const now = new Date();
    const from = new Date(effectiveFrom);
    const until = effectiveUntil ? new Date(effectiveUntil) : null;
    return from <= now && (!until || until > now);
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

  const getImpactBadge = (value: boolean) => {
    return value ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
        <Check className="h-3 w-3 mr-1" />
        Yes
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
        <X className="h-3 w-3 mr-1" />
        No
      </Badge>
    );
  };

  const isActive = isActiveSuspension(suspension.effective_from, suspension.effective_until);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Suspension Details
            {getStatusBadge(suspension.action)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Active Suspension Alert */}
          {isActive && suspension.action === "suspend" && (
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                This suspension is currently <strong>ACTIVE</strong> and affecting the client.
              </AlertDescription>
            </Alert>
          )}

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

          {/* Suspension Impact Section */}
          {suspension.action === "suspend" && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Suspension Impact</h4>
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Visits Blocked:</span>
                    {getImpactBadge(suspension.apply_to?.visits !== false)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Service Actions Blocked:</span>
                    {getImpactBadge(suspension.apply_to?.serviceActions !== false)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Remove from Invoice:</span>
                    {getImpactBadge(suspension.apply_to?.billing === false)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Messaging Blocked:</span>
                    {getImpactBadge(suspension.apply_to?.messaging !== false)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Staff Payment Protected:</span>
                    {getImpactBadge(suspension.notify?.carers === true)}
                  </div>
                </div>
              </Card>
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