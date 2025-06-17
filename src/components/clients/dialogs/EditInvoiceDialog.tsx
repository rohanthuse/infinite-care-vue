
import React, { useState, useEffect } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { EnhancedClientBilling, useUpdateInvoice } from "@/hooks/useEnhancedClientBilling";
import { formatCurrency } from "@/utils/currencyFormatter";

interface EditInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: EnhancedClientBilling | null;
}

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
}

interface InvoiceFormData {
  description: string;
  invoice_date: string;
  due_date: string;
  tax_percentage: number;
  notes: string;
  status: string;
}

export function EditInvoiceDialog({ open, onOpenChange, invoice }: EditInvoiceDialogProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, reset } = useForm<InvoiceFormData>();
  const updateInvoiceMutation = useUpdateInvoice();

  useEffect(() => {
    if (invoice) {
      setValue('description', invoice.description);
      setValue('invoice_date', invoice.invoice_date);
      setValue('due_date', invoice.due_date);
      setValue('tax_percentage', invoice.tax_amount || 0);
      setValue('notes', invoice.notes || '');
      setValue('status', invoice.status);

      // Set line items
      const items = invoice.line_items?.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        line_total: item.line_total
      })) || [];
      setLineItems(items);
    }
  }, [invoice, setValue]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_amount: 0,
        line_total: 0
      }
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate line total
    if (field === 'quantity' || field === 'unit_price' || field === 'discount_amount') {
      const item = updatedItems[index];
      item.line_total = Math.max(0, (item.quantity * item.unit_price) - item.discount_amount);
    }
    
    setLineItems(updatedItems);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTotalDiscounts = () => {
    return lineItems.reduce((sum, item) => sum + item.discount_amount, 0);
  };

  const calculateTaxAmount = () => {
    const subtotal = calculateSubtotal();
    const taxPercentage = watch('tax_percentage') || 0;
    return subtotal * (taxPercentage / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discounts = calculateTotalDiscounts();
    const tax = calculateTaxAmount();
    return subtotal - discounts + tax;
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!invoice) return;

    setIsSubmitting(true);
    try {
      await updateInvoiceMutation.mutateAsync({
        invoiceId: invoice.id,
        invoiceData: {
          description: data.description,
          invoice_date: data.invoice_date,
          due_date: data.due_date,
          tax_amount: data.tax_percentage,
          notes: data.notes,
          status: data.status,
          line_items: lineItems.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_amount: item.discount_amount
          }))
        }
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Edit className="h-5 w-5" />
            Edit Invoice #{invoice.invoice_number}
          </DialogTitle>
          <DialogDescription>
            Modify invoice details, line items, and status
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register('description', { required: true })}
                placeholder="Invoice description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={watch('status')} onValueChange={(value) => setValue('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Invoice Date</Label>
              <Input
                id="invoice_date"
                type="date"
                {...register('invoice_date', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                {...register('due_date', { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_percentage">Tax Percentage (%)</Label>
              <Input
                id="tax_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('tax_percentage', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Line Items</h3>
              <Button type="button" onClick={addLineItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            {lineItems.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price (£)</TableHead>
                    <TableHead>Discount (£)</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.discount_amount}
                          onChange={(e) => updateLineItem(index, 'discount_amount', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.line_total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="flex justify-end space-y-2">
              <div className="text-right space-y-1">
                <div className="flex justify-between w-48">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                {calculateTotalDiscounts() > 0 && (
                  <div className="flex justify-between w-48">
                    <span>Total Discounts:</span>
                    <span>-{formatCurrency(calculateTotalDiscounts())}</span>
                  </div>
                )}
                {(watch('tax_percentage') || 0) > 0 && (
                  <div className="flex justify-between w-48">
                    <span>Tax ({watch('tax_percentage') || 0}%):</span>
                    <span>{formatCurrency(calculateTaxAmount())}</span>
                  </div>
                )}
                <div className="flex justify-between w-48 font-bold text-lg border-t pt-1">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes for this invoice"
              rows={3}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
