import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ServiceRate } from "@/hooks/useAccountingData";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { useAuthorities } from "@/contexts/AuthoritiesContext";

interface ViewRateDialogProps {
  open: boolean;
  onClose: () => void;
  onEdit: (rate: ServiceRate) => void;
  rate: ServiceRate | null;
}

const ViewRateDialog: React.FC<ViewRateDialogProps> = ({
  open,
  onClose,
  onEdit,
  rate
}) => {
  const { authorities } = useAuthorities();

  if (!rate) return null;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Ongoing";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDays = (days: string[]) => {
    if (!days || days.length === 0) return "None selected";
    if (days.length === 7 || days.length === 8) return "All days";
    
    const dayMap: Record<string, string> = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
      bank_holiday: "Bank Holiday"
    };
    
    return days.map(day => dayMap[day] || day).join(", ");
  };

  // Get authority name from ID
  const getAuthorityName = (authorityId: string) => {
    const authority = authorities.find(a => a.id === authorityId);
    return authority?.organization || authorityId || "Not specified";
  };

  // Map type value to label
  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      client: "Client Rate",
      staff: "Staff Rate",
      authority: "Authority Rate",
      fees: "Fees"
    };
    return typeLabels[type] || type || "Not specified";
  };

  // Map pay_based_on to display label
  const getChargeBasedOnLabel = (payBasedOn?: string) => {
    const labels: Record<string, string> = {
      service: "Services",
      hours_minutes: "Hours/Minutes",
      fixed: "Fix Flat Rate"
    };
    return labels[payBasedOn || ''] || payBasedOn || "Not specified";
  };

  // Map charge_type to display label
  const getChargeTypeLabel = (chargeType?: string) => {
    const labels: Record<string, string> = {
      flat_rate: "Flat Rate",
      pro_rata: "Pro Rata",
      hourly_rate: "Hourly Rate",
      rate_per_hour: "Rate Per Hour",
      rate_per_minutes_pro_rata: "Rate Per Minutes (Pro Rata)",
      rate_per_minutes_flat_rate: "Rate Per Minutes (Flat Rate)"
    };
    return labels[chargeType || ''] || chargeType || "Not specified";
  };

  // Check if minute-based rates should be shown
  const showMinuteRates = rate.charge_type?.includes('minutes') || 
    (rate.rate_15_minutes || rate.rate_30_minutes || rate.rate_45_minutes || rate.rate_60_minutes);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>View Rate Details</span>
            {rate.is_default && (
              <Badge className="ml-2">Default Rate</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Rate Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Basic Rate Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                <p className="mt-1">{getTypeLabel(rate.client_type)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Authority</h4>
                <p className="mt-1">{getAuthorityName(rate.funding_source)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Caption</h4>
              <p className="mt-1">{rate.service_name || "Not specified"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Start Date</h4>
                <p className="mt-1">{formatDate(rate.effective_from)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">End Date</h4>
                <p className="mt-1">{formatDate(rate.effective_to)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
              <p className="mt-1">
                <Badge 
                  variant={
                    rate.status === "active" ? "default" : 
                    rate.status === "pending" ? "secondary" : 
                    rate.status === "expired" ? "outline" : 
                    "destructive"
                  }
                >
                  {rate.status?.charAt(0).toUpperCase() + rate.status?.slice(1) || "Unknown"}
                </Badge>
              </p>
            </div>
          </div>

          {/* Rates Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Rate Configuration
            </h3>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Applicable Days</h4>
              <p className="mt-1">{formatDays(rate.applicable_days)}</p>
            </div>

            {rate.rate_category && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Rate Type</h4>
                <p className="mt-1 capitalize">{rate.rate_category}</p>
              </div>
            )}

            {(rate.time_from || rate.time_until) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Effective From (Time)</h4>
                  <p className="mt-1">{rate.time_from || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Effective Until (Time)</h4>
                  <p className="mt-1">{rate.time_until || "Not specified"}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Charge Based On</h4>
                <p className="mt-1">{getChargeBasedOnLabel(rate.pay_based_on)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Charge Type</h4>
                <p className="mt-1">{getChargeTypeLabel(rate.charge_type)}</p>
              </div>
            </div>

            {/* Rate Values */}
            {showMinuteRates ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Rate Values</h4>
                <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-md">
                  {rate.rate_15_minutes !== null && rate.rate_15_minutes !== undefined && (
                    <div>
                      <span className="text-xs text-muted-foreground">15 Minutes:</span>
                      <p className="font-medium">{formatCurrency(rate.rate_15_minutes)}</p>
                    </div>
                  )}
                  {rate.rate_30_minutes !== null && rate.rate_30_minutes !== undefined && (
                    <div>
                      <span className="text-xs text-muted-foreground">30 Minutes:</span>
                      <p className="font-medium">{formatCurrency(rate.rate_30_minutes)}</p>
                    </div>
                  )}
                  {rate.rate_45_minutes !== null && rate.rate_45_minutes !== undefined && (
                    <div>
                      <span className="text-xs text-muted-foreground">45 Minutes:</span>
                      <p className="font-medium">{formatCurrency(rate.rate_45_minutes)}</p>
                    </div>
                  )}
                  {rate.rate_60_minutes !== null && rate.rate_60_minutes !== undefined && (
                    <div>
                      <span className="text-xs text-muted-foreground">60 Minutes:</span>
                      <p className="font-medium">{formatCurrency(rate.rate_60_minutes)}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Rate Amount</h4>
                <p className="mt-1 font-semibold text-lg">{formatCurrency(rate.amount)}</p>
              </div>
            )}

            {rate.consecutive_hours !== null && rate.consecutive_hours !== undefined && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Consecutive Hours Rate</h4>
                <p className="mt-1">{formatCurrency(rate.consecutive_hours)}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">VATable</h4>
              <p className="mt-1">{rate.service_type === 'vatable' ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Additional Info */}
          {rate.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Additional Information
              </h3>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                <p className="mt-1 text-sm">{rate.description}</p>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>Created: {formatDate(rate.created_at)}</p>
            <p>Last Updated: {formatDate(rate.updated_at)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={() => {
              onClose();
              onEdit(rate);
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Rate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewRateDialog;
