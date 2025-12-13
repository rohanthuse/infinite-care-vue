import React, { useState } from 'react';
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

export const AddVisitExpenseDialog: React.FC<AddVisitExpenseDialogProps> = ({
  open,
  onOpenChange,
  appointment,
}) => {
  const { data: expenseTypeOptions = [], isLoading: expenseTypesLoading } = useExpenseTypeOptions();
  const submitExpense = useVisitExpenseSubmission();

  const [formData, setFormData] = useState({
    expense_type_id: '',
    expense_date: appointment?.start_time ? format(new Date(appointment.start_time), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    description: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Reset form when dialog opens with new appointment
  React.useEffect(() => {
    if (open && appointment) {
      setFormData({
        expense_type_id: '',
        expense_date: format(new Date(appointment.start_time), 'yyyy-MM-dd'),
        amount: '',
        description: '',
      });
      setReceiptFile(null);
    }
  }, [open, appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointment?.id || !appointment?.client_id) {
      return;
    }

    if (!formData.expense_type_id || !formData.amount || parseFloat(formData.amount) <= 0) {
      return;
    }

    await submitExpense.mutateAsync({
      booking_id: appointment.id,
      client_id: appointment.client_id,
      expense_type_id: formData.expense_type_id,
      expense_date: formData.expense_date,
      amount: parseFloat(formData.amount),
      description: formData.description,
      receipt_file: receiptFile || undefined,
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
      <DialogContent className="sm:max-w-[500px]">
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
              onValueChange={(value) => setFormData(prev => ({ ...prev, expense_type_id: value }))}
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

          {/* Expense Date */}
          <div className="space-y-2">
            <Label htmlFor="expense_date">Expense Date *</Label>
            <Input
              id="expense_date"
              type="date"
              value={formData.expense_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea
              id="description"
              placeholder="Enter details about this expense..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
