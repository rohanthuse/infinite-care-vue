import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  Clock, 
  FileWarning, 
  CheckCircle2,
  FileText,
  ClipboardList,
  Download
} from "lucide-react";
import { DocumentItem } from "@/hooks/useStaffComplianceMatrix";
import { format } from "date-fns";
import { generateStaffCompliancePDF } from "@/utils/staffCompliancePdfGenerator";
import { toast } from "sonner";

interface StaffComplianceBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  branchName: string;
  breakdown: {
    expiredItems: DocumentItem[];
    expiringItems: DocumentItem[];
    pendingItems: DocumentItem[];
    notUpdatedItems: DocumentItem[];
    compliantItems: DocumentItem[];
  };
}

export function StaffComplianceBreakdownDialog({
  open,
  onOpenChange,
  staffName,
  branchName,
  breakdown,
}: StaffComplianceBreakdownDialogProps) {
  const handleExportPDF = () => {
    try {
      generateStaffCompliancePDF(staffName, breakdown, branchName);
      toast.success("Compliance report exported successfully", {
        description: `${staffName}'s detailed report has been downloaded as PDF`
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", {
        description: "There was an error exporting the compliance report"
      });
    }
  };
  
  const renderItem = (item: DocumentItem) => {
    const Icon = item.type === 'document' ? FileText : ClipboardList;
    
    return (
      <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
        <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{item.name}</p>
              {item.category && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Badge variant="outline" className="text-xs">
                {item.type === 'document' ? 'Document' : 'Essential'}
              </Badge>
              {item.isNotUpdated && (
                <Badge variant="destructive" className="text-xs">
                  Not Updated
                </Badge>
              )}
            </div>
          </div>
          {item.expiryDate && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {item.daysUntilExpiry !== null && item.daysUntilExpiry < 0
                  ? `Expired ${Math.abs(item.daysUntilExpiry)} days ago`
                  : item.daysUntilExpiry !== null && item.daysUntilExpiry === 0
                  ? 'Expires today'
                  : item.daysUntilExpiry !== null
                  ? `Expires in ${item.daysUntilExpiry} days`
                  : `Expires on ${format(new Date(item.expiryDate), 'MMM dd, yyyy')}`
                }
              </span>
            </div>
          )}
          {item.type === 'essential' && item.updatedAt && !item.isNotUpdated && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Completed: {format(new Date(item.updatedAt), 'MMM dd, yyyy')}</span>
            </div>
          )}
          <div className="flex gap-2 mt-2">
            {item.required && (
              <Badge variant="secondary" className="text-xs">Required</Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  const totalIssues = 
    breakdown.expiredItems.length + 
    breakdown.expiringItems.length + 
    breakdown.pendingItems.length +
    breakdown.notUpdatedItems.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle className="text-xl">
              Compliance Breakdown: {staffName}
            </DialogTitle>
            <DialogDescription>
              Detailed view of documents and essentials status
            </DialogDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive">Issues Found</p>
                <p className="text-2xl font-bold text-destructive">{totalIssues}</p>
              </div>
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm font-medium text-success">Compliant Items</p>
                <p className="text-2xl font-bold text-success">
                  {breakdown.compliantItems.length}
                </p>
              </div>
            </div>

            {/* Expired Items */}
            {breakdown.expiredItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">
                    Expired Items ({breakdown.expiredItems.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {breakdown.expiredItems.map(renderItem)}
                </div>
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
                <div className="space-y-2">
                  {breakdown.expiringItems.map(renderItem)}
                </div>
              </div>
            )}

            {/* Not Updated Required Items */}
            {breakdown.notUpdatedItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">
                    Required Items Not Updated ({breakdown.notUpdatedItems.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {breakdown.notUpdatedItems.map(renderItem)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  These required essentials have been created but never updated or completed.
                </p>
              </div>
            )}

            {/* Pending Required Items */}
            {breakdown.pendingItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileWarning className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold text-warning">
                    Pending Required Items ({breakdown.pendingItems.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {breakdown.pendingItems.map(renderItem)}
                </div>
              </div>
            )}

            <Separator />

            {/* Compliant Items */}
            {breakdown.compliantItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <h3 className="font-semibold text-success">
                    Compliant Items ({breakdown.compliantItems.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {breakdown.compliantItems.map(renderItem)}
                </div>
              </div>
            )}

            {totalIssues === 0 && breakdown.compliantItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items found for this staff member</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
