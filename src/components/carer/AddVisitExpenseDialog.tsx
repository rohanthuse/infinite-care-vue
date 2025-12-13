import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useExpenseTypeOptions } from '@/hooks/useParameterOptions';
import { useVisitExpenseSubmission } from '@/hooks/useVisitExpenseSubmission';
import { format } from 'date-fns';
import { Receipt, Upload, Loader2 } from 'lucide-react';
import {
  TravelExpenseFields,
  MealExpenseFields,
  MedicalExpenseFields,
  OtherExpenseFields,
  detectExpenseCategory,
  buildExpenseMetadata,
} from './expense-fields';

interface AddVisitExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    client_id?: string;
    start_time: string;
    clients?: {
      first_name?: string;
      last_name?: string;
    };
  } | null;
}

const initialFormData = {
  expense_type_id: '',
  expense_date: '',
  amount: '',
  description: '',
  // Travel fields
  travel_mode: '',
  from_location: '',
  to_location: '',
  distance: '',
  distance_unit: 'miles',
  rate_per_unit: '',
  // Meal fields
  meal_type: '',
  vendor_name: '',
  meal_date: '',
  // Medical fields
  medical_item: '',
  provider_name: '',
  prescription_ref: '',
  // Other fields
  expense_title: '',
  other_description: '',
};

export const AddVisitExpenseDialog: React.FC<AddVisitExpenseDialogProps> = ({
  open,
  onOpenChange,
  appointment,
}) => {
  const { data: expenseTypeOptions = [], isLoading: expenseTypesLoading } = useExpenseTypeOptions();
  const submitExpense = useVisitExpenseSubmission();

  const [formData, setFormData] = useState({
    ...initialFormData,
    expense_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Get selected expense type label for category detection
  const selectedExpenseType = expenseTypeOptions.find(
    (opt: { value: string; label: string }) => opt.value === formData.expense_type_id
  );
  const expenseCategory = selectedExpenseType
    ? detectExpenseCategory(selectedExpenseType.label)
    : null;

  // Reset form when dialog opens with new appointment
  React.useEffect(() => {
    if (open && appointment) {
      setFormData({
        ...initialFormData,
        expense_date: format(new Date(appointment.start_time), 'yyyy-MM-dd'),
        meal_date: format(new Date(appointment.start_time), 'yyyy-MM-dd'),
      });
      setReceiptFile(null);
    }
  }, [open, appointment]);

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAmountChange = useCallback((amount: string) => {
    setFormData(prev => ({ ...prev, amount }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointment?.id || !appointment?.client_id) {
      return;
    }

    if (!formData.expense_type_id || !formData.amount || parseFloat(formData.amount) <= 0) {
      return;
    }

    // Build metadata based on category, always include client_name for notifications
    const metadata = expenseCategory
      ? { ...buildExpenseMetadata(expenseCategory, formData), client_name: clientName }
      : { client_name: clientName };

    await submitExpense.mutateAsync({
      booking_id: appointment.id,
      client_id: appointment.client_id,
      expense_type_id: formData.expense_type_id,
      expense_date: formData.expense_date,
      amount: parseFloat(formData.amount),
      description: formData.description,
      receipt_file: receiptFile || undefined,
      metadata,
    });

    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const clientName = appointment?.clients 
    ? `${appointment.clients.first_name || ''} ${appointment.clients.last_name || ''}`.trim()
    : 'Unknown Client';

  const visitDate = appointment?.start_time 
    ? format(new Date(appointment.start_time), 'dd MMM yyyy')
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Add Expense for Visit
          </DialogTitle>
          <DialogDescription>
            Submit an expense claim for your visit with {clientName} on {visitDate}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Expense Type */}
          <div className="space-y-2">
            <Label htmlFor="expense_type">Expense Type *</Label>
            <Select
              value={formData.expense_type_id}
              onValueChange={(value) => handleFieldChange('expense_type_id', value)}
              disabled={expenseTypesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expense type" />
              </SelectTrigger>
              <SelectContent>
                {expenseTypeOptions.map((option: { value: string; label: string }) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Fields Based on Category */}
          {expenseCategory === 'travel' && (
            <TravelExpenseFields
              formData={{
                travel_mode: formData.travel_mode,
                from_location: formData.from_location,
                to_location: formData.to_location,
                distance: formData.distance,
                distance_unit: formData.distance_unit,
                rate_per_unit: formData.rate_per_unit,
              }}
              onFieldChange={handleFieldChange}
              onAmountChange={handleAmountChange}
            />
          )}

          {expenseCategory === 'meal' && (
            <MealExpenseFields
              formData={{
                meal_type: formData.meal_type,
                vendor_name: formData.vendor_name,
                meal_date: formData.meal_date,
              }}
              onFieldChange={handleFieldChange}
            />
          )}

          {expenseCategory === 'medical' && (
            <MedicalExpenseFields
              formData={{
                medical_item: formData.medical_item,
                provider_name: formData.provider_name,
                prescription_ref: formData.prescription_ref,
              }}
              onFieldChange={handleFieldChange}
            />
          )}

          {expenseCategory === 'other' && (
            <OtherExpenseFields
              formData={{
                expense_title: formData.expense_title,
                other_description: formData.other_description,
              }}
              onFieldChange={handleFieldChange}
            />
          )}

          {/* Common Fields - Always Visible */}
          {/* Expense Date */}
          <div className="space-y-2">
            <Label htmlFor="expense_date">Expense Date *</Label>
            <Input
              id="expense_date"
              type="date"
              value={formData.expense_date}
              onChange={(e) => handleFieldChange('expense_date', e.target.value)}
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (£) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleFieldChange('amount', e.target.value)}
              required
            />
            {expenseCategory === 'travel' && formData.distance && formData.rate_per_unit && (
              <p className="text-xs text-muted-foreground">
                Auto-calculated from distance × rate
              </p>
            )}
          </div>

          {/* Notes / Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Notes / Description</Label>
            <Textarea
              id="description"
              placeholder="Enter any additional notes..."
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label htmlFor="receipt">Upload Receipt (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              {receiptFile && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  {receiptFile.name.length > 20 
                    ? `${receiptFile.name.substring(0, 20)}...` 
                    : receiptFile.name}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitExpense.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitExpense.isPending || !formData.expense_type_id || !formData.amount}
            >
              {submitExpense.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Expense'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
