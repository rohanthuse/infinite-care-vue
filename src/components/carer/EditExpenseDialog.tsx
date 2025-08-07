
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useExpenseTypeOptions } from "@/hooks/useParameterOptions";

interface EditExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  expense: any;
  onUpdate: (expenseData: any) => Promise<void>;
  isUpdating: boolean;
}

const EditExpenseDialog: React.FC<EditExpenseDialogProps> = ({
  open,
  onClose,
  expense,
  onUpdate,
  isUpdating
}) => {
  const { data: expenseTypeOptions = [], isLoading: expenseTypesLoading } = useExpenseTypeOptions();
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    category: "",
    amount: "",
    date: "",
    notes: "",
    receipt: null as File | null,
  });

  useEffect(() => {
    if (expense && open) {
      setExpenseForm({
        description: expense.description || "",
        category: expense.category || "",
        amount: expense.amount?.toString() || "",
        date: expense.expense_date ? format(new Date(expense.expense_date), 'yyyy-MM-dd') : "",
        notes: expense.notes || "",
        receipt: null,
      });
    }
  }, [expense, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expenseForm.description || !expenseForm.category || !expenseForm.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await onUpdate({
        id: expense.id,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        expense_date: expenseForm.date,
        notes: expenseForm.notes || undefined,
        receipt_file: expenseForm.receipt || undefined,
      });
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExpenseForm(prev => ({ ...prev, receipt: file }));
    }
  };

  // Only allow editing if expense is pending
  const isEditable = expense?.status === 'pending';

  if (!isEditable) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense Claim</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p className="text-gray-600 mb-4">
              This expense cannot be edited because it has been {expense?.status}.
            </p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Expense Claim</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <Input 
              placeholder="Brief description of expense"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Category *</label>
            <Select 
              value={expenseForm.category} 
              onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}
              disabled={expenseTypesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={expenseTypesLoading ? "Loading categories..." : "Select category"} />
              </SelectTrigger>
              <SelectContent>
                {expenseTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (£) *</label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="0.00"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date *</label>
              <Input 
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Input 
              placeholder="Additional notes (optional)"
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload New Receipt</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                id="receipt-upload-edit"
              />
              <label htmlFor="receipt-upload-edit" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>Select File</span>
                </Button>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                {expenseForm.receipt ? expenseForm.receipt.name : 'PDF, JPG or PNG up to 5MB (optional)'}
              </p>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Expense'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;
