import React from "react";
import { format } from "date-fns";
import { 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Car, 
  Utensils, 
  Stethoscope,
  Receipt
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookingExpense } from "@/hooks/useExpensesByBooking";

interface ViewBookingExpenseDialogProps {
  expense: BookingExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ViewBookingExpenseDialog: React.FC<ViewBookingExpenseDialogProps> = ({
  expense,
  open,
  onOpenChange,
}) => {
  if (!expense) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <Badge variant="custom" className="bg-green-100 text-green-700 gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="custom" className="bg-red-100 text-red-700 gap-1">
            <X className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="custom" className="bg-amber-100 text-amber-700 gap-1">
            <Clock className="h-3 w-3" />
            Pending Approval
          </Badge>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'travel':
      case 'mileage':
        return <Car className="h-5 w-5 text-blue-500" />;
      case 'meal':
      case 'food':
        return <Utensils className="h-5 w-5 text-orange-500" />;
      case 'medical':
      case 'healthcare':
        return <Stethoscope className="h-5 w-5 text-green-500" />;
      default:
        return <Receipt className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const renderMetadataFields = () => {
    if (!expense.metadata || Object.keys(expense.metadata).length === 0) {
      return null;
    }

    const metadata = expense.metadata;
    const fields: { label: string; value: string }[] = [];

    // Travel-specific fields
    if (metadata.travel_mode) fields.push({ label: 'Travel Mode', value: metadata.travel_mode });
    if (metadata.from_location) fields.push({ label: 'From', value: metadata.from_location });
    if (metadata.to_location) fields.push({ label: 'To', value: metadata.to_location });
    if (metadata.distance) fields.push({ label: 'Distance', value: `${metadata.distance} miles` });
    if (metadata.mileage_rate) fields.push({ label: 'Rate', value: `${metadata.mileage_rate}p/mile` });

    // Meal-specific fields
    if (metadata.meal_type) fields.push({ label: 'Meal Type', value: metadata.meal_type });
    if (metadata.vendor) fields.push({ label: 'Vendor', value: metadata.vendor });

    // Medical-specific fields
    if (metadata.item_name) fields.push({ label: 'Item', value: metadata.item_name });
    if (metadata.provider) fields.push({ label: 'Provider', value: metadata.provider });
    if (metadata.prescription_ref) fields.push({ label: 'Prescription Ref', value: metadata.prescription_ref });

    // Generic fields
    if (metadata.notes) fields.push({ label: 'Notes', value: metadata.notes });

    if (fields.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Additional Details</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {fields.map((field, idx) => (
            <div key={idx} className="space-y-0.5">
              <span className="text-xs text-muted-foreground">{field.label}</span>
              <p className="font-medium">{field.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getCategoryIcon(expense.category)}
            Expense Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount & Status */}
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(expense.amount)}
            </div>
            {getStatusBadge(expense.status)}
          </div>

          <Separator />

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground">Category</span>
              <p className="font-medium capitalize">{expense.category}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground">Date</span>
              <p className="font-medium">
                {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Description */}
          {expense.description && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Description</span>
              <p className="text-sm">{expense.description}</p>
            </div>
          )}

          {/* Metadata Fields */}
          {renderMetadataFields()}

          {/* Rejection Reason */}
          {expense.status?.toLowerCase() === 'rejected' && expense.rejection_reason && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-1">
              <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
                <AlertCircle className="h-4 w-4" />
                Rejection Reason
              </div>
              <p className="text-sm text-red-600">{expense.rejection_reason}</p>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewBookingExpenseDialog;
