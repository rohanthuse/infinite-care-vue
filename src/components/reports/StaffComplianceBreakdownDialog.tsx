import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, Clock, FileText, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import type { DocumentItem } from "@/hooks/useStaffComplianceMatrix";

interface StaffComplianceBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  breakdown: {
    expiredItems: DocumentItem[];
    expiringItems: DocumentItem[];
    pendingItems: DocumentItem[];
    compliantItems: DocumentItem[];
  };
}

export function StaffComplianceBreakdownDialog({
  open,
  onOpenChange,
  staffName,
  breakdown,
}: StaffComplianceBreakdownDialogProps) {
  const renderItem = (item: DocumentItem) => {
    const icon = item.type === 'document' ? (
      <FileText className="h-4 w-4" />
    ) : (
      <ClipboardList className="h-4 w-4" />
    );

    const typeLabel = item.type === 'document' ? 'Document' : 'Essential';

    return (
      <div key={item.id} className="flex items-start justify-between gap-3 py-2">
        <div className="flex items-start gap-2 flex-1">
          <div className="mt-0.5">{icon}</div>
          <div className="flex-1">
            <p className="font-medium text-sm">{item.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {typeLabel}
              </Badge>
              {item.required && (
                <Badge variant="secondary" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {item.expiry_date && (
            <p>Expires: {format(new Date(item.expiry_date), 'MMM dd, yyyy')}</p>
          )}
        </div>
      </div>
    );
  };

  const totalItems =
    breakdown.expiredItems.length +
    breakdown.expiringItems.length +
    breakdown.pendingItems.length +
    breakdown.compliantItems.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Compliance Breakdown - {staffName}</DialogTitle>
          <DialogDescription>
            Detailed view of all documents and essentials for this staff member ({totalItems} total)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Expired Items */}
            {breakdown.expiredItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">
                    Expired ({breakdown.expiredItems.length})
                  </h3>
                </div>
                <div className="space-y-1 border-l-2 border-destructive pl-4">
                  {breakdown.expiredItems.map(renderItem)}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* Expiring Soon Items */}
            {breakdown.expiringItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold text-warning">
                    Expiring Soon (Within 30 Days) ({breakdown.expiringItems.length})
                  </h3>
                </div>
                <div className="space-y-1 border-l-2 border-warning pl-4">
                  {breakdown.expiringItems.map(renderItem)}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* Pending Items */}
            {breakdown.pendingItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold text-warning">
                    Pending Required Items ({breakdown.pendingItems.length})
                  </h3>
                </div>
                <div className="space-y-1 border-l-2 border-warning pl-4">
                  {breakdown.pendingItems.map(renderItem)}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* Compliant Items */}
            {breakdown.compliantItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <h3 className="font-semibold text-success">
                    Compliant ({breakdown.compliantItems.length})
                  </h3>
                </div>
                <div className="space-y-1 border-l-2 border-success pl-4">
                  {breakdown.compliantItems.map(renderItem)}
                </div>
              </div>
            )}

            {/* No Items */}
            {totalItems === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No documents or essentials found for this staff member.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
