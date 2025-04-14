
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ServiceRate, rateTypeLabels, clientTypeLabels, fundingSourceLabels, rateStatusLabels } from "@/types/rate";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Pencil } from "lucide-react";

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
  if (!rate) return null;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Ongoing";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDays = (days: string[]) => {
    if (days.length === 7) return "All days";
    
    const dayMap: Record<string, string> = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday"
    };
    
    return days.map(day => dayMap[day]).join(", ");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Rate Details</span>
            {rate.isDefault && (
              <Badge className="ml-2">Default Rate</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Service</h3>
              <p className="mt-1">{rate.serviceName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Service Code</h3>
              <p className="mt-1">{rate.serviceCode}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Rate Type</h3>
              <p className="mt-1">{rateTypeLabels[rate.rateType]}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Amount</h3>
              <p className="mt-1 font-semibold">{formatCurrency(rate.amount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Effective From</h3>
              <p className="mt-1">{formatDate(rate.effectiveFrom)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Effective To</h3>
              <p className="mt-1">{formatDate(rate.effectiveTo)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Client Type</h3>
              <p className="mt-1">{clientTypeLabels[rate.clientType]}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Funding Source</h3>
              <p className="mt-1">{fundingSourceLabels[rate.fundingSource]}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1">
                <Badge 
                  variant={
                    rate.status === "active" ? "default" : 
                    rate.status === "pending" ? "secondary" : 
                    rate.status === "expired" ? "outline" : 
                    "destructive"
                  }
                >
                  {rateStatusLabels[rate.status]}
                </Badge>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
              <p className="mt-1">{formatDate(rate.lastUpdated)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Applicable Days</h3>
            <p className="mt-1">{formatDays(rate.applicableDays)}</p>
          </div>

          {rate.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-sm">{rate.description}</p>
            </div>
          )}
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
