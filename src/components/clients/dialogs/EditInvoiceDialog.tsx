import React, { useState, useEffect, useMemo } from "react";
import { Edit, AlertTriangle, Lock, Save, RefreshCw } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { EnhancedClientBilling, useUpdateInvoice } from "@/hooks/useEnhancedClientBilling";
import { useAdminClientDetail } from "@/hooks/useAdminClientData";
import { useInvoiceExpenseEntries, useDeleteInvoiceExpenseEntry } from "@/hooks/useInvoiceExpenses";
import { useInvoiceExtraTimeEntries, useRemoveExtraTimeFromInvoice, calculateExtraTimeTotals } from "@/hooks/useInvoiceExtraTimeEntries";
import { useInvoiceCancelledBookings } from "@/hooks/useInvoiceCancelledBookings";
import { useUpdateCancelledBookingInvoiceStatus } from "@/hooks/useUpdateCancelledBookingInvoiceStatus";
import { EditableLineItemsSection, EditableLineItem } from "./EditableLineItemsSection";
import { EditableExtraTimeSection } from "./EditableExtraTimeSection";
import { EditableExpensesSection } from "./EditableExpensesSection";
import { EditableCancelledBookingsSection } from "./EditableCancelledBookingsSection";
import { InvoiceTotalSummary } from "./InvoiceTotalSummary";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: EnhancedClientBilling | null;
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
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingExtraTime, setRemovingExtraTime] = useState<string | null>(null);
  const [removingExpense, setRemovingExpense] = useState<string | null>(null);
  const [updatingCancelledBooking, setUpdatingCancelledBooking] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, reset } = useForm<InvoiceFormData>();
  const updateInvoiceMutation = useUpdateInvoice();
  
  // Fetch client data
  const { data: clientData } = useAdminClientDetail(invoice?.client_id || '');
  
  // Fetch related data
  const { data: expenseEntries = [], isLoading: isLoadingExpenses } = useInvoiceExpenseEntries(invoice?.id);
  const { data: extraTimeEntries = [], isLoading: isLoadingExtraTime } = useInvoiceExtraTimeEntries(invoice?.id);
  const { data: cancelledBookings = [], isLoading: isLoadingCancelled } = useInvoiceCancelledBookings(invoice?.id);
  
  // Mutations
  const deleteExpenseMutation = useDeleteInvoiceExpenseEntry();
  const removeExtraTimeMutation = useRemoveExtraTimeFromInvoice();
  const updateCancelledBookingMutation = useUpdateCancelledBookingInvoiceStatus();

  // Check if invoice is editable
  const isReadOnly = useMemo(() => {
    if (!invoice) return true;
    return invoice.is_locked || ['paid', 'cancelled', 'refunded'].includes(invoice.status);
  }, [invoice]);

  const isPaid = invoice?.status === 'paid';
  const isSent = invoice?.status === 'sent';

  // Calculate totals
  const lineItemsTotal = useMemo(() => 
    lineItems.reduce((sum, item) => sum + item.line_total, 0), 
    [lineItems]
  );

  const expensesTotal = useMemo(() => 
    expenseEntries.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenseEntries]
  );

  const extraTimeTotals = useMemo(() => 
    calculateExtraTimeTotals(extraTimeEntries),
    [extraTimeEntries]
  );

  const cancelledBookingFees = useMemo(() => 
    cancelledBookings
      .filter(b => b.suspension_honor_staff_payment && b.staff_payment_amount && b.is_invoiced !== false)
      .reduce((sum, b) => sum + (b.staff_payment_amount || 0), 0),
    [cancelledBookings]
  );

  // Initialize form when invoice changes
  useEffect(() => {
    if (invoice && open) {
      setValue('description', invoice.description);
      setValue('invoice_date', invoice.invoice_date);
      setValue('due_date', invoice.due_date);
      setValue('tax_percentage', invoice.tax_amount || 0);
      setValue('notes', invoice.notes || '');
      setValue('status', invoice.status);

      // Set line items
      const items: EditableLineItem[] = invoice.line_items?.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount || 0,
        line_total: item.line_total,
        visit_date: item.visit_date,
      })) || [];
      setLineItems(items);
    }
  }, [invoice, open, setValue]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setRemovingExtraTime(null);
      setRemovingExpense(null);
      setUpdatingCancelledBooking(null);
    }
  }, [open]);

  const handleRemoveExtraTime = async (entryId: string) => {
    if (!invoice) return;
    setRemovingExtraTime(entryId);
    try {
      await removeExtraTimeMutation.mutateAsync({
        extraTimeId: entryId,
        invoiceId: invoice.id,
      });
    } finally {
      setRemovingExtraTime(null);
    }
  };

  const handleRemoveExpense = async (entryId: string) => {
    if (!invoice) return;
    setRemovingExpense(entryId);
    try {
      await deleteExpenseMutation.mutateAsync({
        entryId,
        invoiceId: invoice.id,
      });
    } finally {
      setRemovingExpense(null);
    }
  };

  const handleToggleCancelledBooking = async (bookingId: string, isIncluded: boolean) => {
    if (!invoice) return;
    setUpdatingCancelledBooking(bookingId);
    try {
      await updateCancelledBookingMutation.mutateAsync({
        bookingId,
        invoiceId: invoice.id,
        isInvoiced: isIncluded,
      });
    } finally {
      setUpdatingCancelledBooking(null);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!invoice || isReadOnly) return;

    setIsSubmitting(true);
    try {
      // Calculate new totals
      const newLineItemsTotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
      const newSubtotal = newLineItemsTotal + expensesTotal + extraTimeTotals.totalCost + cancelledBookingFees;
      const vatAmount = newSubtotal * (data.tax_percentage / 100);
      const newTotal = newSubtotal + vatAmount;

      // Update invoice main fields
      const { error: invoiceError } = await supabase
        .from('client_billing')
        .update({
          description: data.description,
          invoice_date: data.invoice_date,
          due_date: data.due_date,
          tax_amount: data.tax_percentage,
          notes: data.notes,
          status: data.status,
          total_amount: newTotal,
          net_amount: newSubtotal,
          vat_amount: vatAmount,
        })
        .eq('id', invoice.id);

      if (invoiceError) throw invoiceError;

      // Handle line items - delete removed, update existing, insert new
      const existingIds = invoice.line_items?.map(li => li.id) || [];
      const currentIds = lineItems.filter(li => li.id).map(li => li.id);
      const idsToDelete = existingIds.filter(id => !currentIds.includes(id));

      // Delete removed line items
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('invoice_line_items')
          .delete()
          .in('id', idsToDelete);
        if (deleteError) console.error('Error deleting line items:', deleteError);
      }

      // Update/Insert line items
      for (const item of lineItems) {
        if (item.id && !item.isNew) {
          // Update existing
          await supabase
            .from('invoice_line_items')
            .update({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount_amount: item.discount_amount,
              line_total: item.line_total,
            })
            .eq('id', item.id);
        } else {
          // Insert new
          await supabase
            .from('invoice_line_items')
            .insert({
              invoice_id: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount_amount: item.discount_amount,
              line_total: item.line_total,
              organization_id: invoice.organization_id,
            });
        }
      }

      toast.success('Invoice updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update invoice:', error);
      toast.error('Failed to update invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!invoice) return null;

  const clientName = clientData
    ? `${clientData.preferred_name || clientData.first_name || ''} ${clientData.last_name || ''}`.trim()
    : 'Loading...';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Edit className="h-5 w-5" />
                Edit Invoice #{invoice.invoice_number}
              </DialogTitle>
              <DialogDescription>
                Modify invoice details, line items, expenses, and more
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isReadOnly ? "destructive" : "secondary"}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
              {invoice.is_locked && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(95vh-180px)]">
          <div className="px-6 py-4 space-y-6">
            {/* Read-only Warning */}
            {isReadOnly && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Invoice is Read-Only</AlertTitle>
                <AlertDescription>
                  {isPaid
                    ? "This invoice has been paid. Editing is restricted to prevent accounting discrepancies."
                    : invoice.is_locked
                    ? "This invoice is locked. Contact an administrator to unlock it."
                    : "This invoice cannot be edited due to its current status."}
                </AlertDescription>
              </Alert>
            )}

            {/* Sent Invoice Warning */}
            {isSent && !isReadOnly && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Invoice Already Sent</AlertTitle>
                <AlertDescription>
                  This invoice has been sent to the client. Changes will be logged for audit purposes.
                </AlertDescription>
              </Alert>
            )}

            {/* Invoice Header Section */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Invoice Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Client Name (Read-only) */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Client</Label>
                  <Input value={clientName} disabled className="bg-muted" />
                </div>

                {/* Invoice Number (Read-only) */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Invoice Number</Label>
                  <Input value={invoice.invoice_number} disabled className="bg-muted" />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="ready_to_charge">Ready to Charge</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid" disabled={!isPaid}>Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    {...register('description', { required: true })}
                    placeholder="Invoice description"
                    disabled={isReadOnly}
                  />
                </div>

                {/* Invoice Date */}
                <div className="space-y-2">
                  <Label htmlFor="invoice_date">Invoice Date</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    {...register('invoice_date', { required: true })}
                    disabled={isReadOnly}
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    {...register('due_date', { required: true })}
                    disabled={isReadOnly}
                  />
                </div>

                {/* Tax Percentage */}
                <div className="space-y-2">
                  <Label htmlFor="tax_percentage">VAT Percentage (%)</Label>
                  <Input
                    id="tax_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register('tax_percentage', { valueAsNumber: true })}
                    placeholder="0.00"
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Line Items Section */}
            <EditableLineItemsSection
              lineItems={lineItems}
              onUpdate={setLineItems}
              isReadOnly={isReadOnly}
            />

            <Separator />

            {/* Extra Time Section */}
            <EditableExtraTimeSection
              extraTimeEntries={extraTimeEntries}
              isLoading={isLoadingExtraTime}
              onRemove={handleRemoveExtraTime}
              onAddClick={() => toast.info('Add Extra Time feature coming soon')}
              isReadOnly={isReadOnly}
              isRemoving={removingExtraTime}
            />

            <Separator />

            {/* Expenses Section */}
            <EditableExpensesSection
              expenses={expenseEntries}
              isLoading={isLoadingExpenses}
              onRemove={handleRemoveExpense}
              onAddClick={() => toast.info('Add Expense feature coming soon')}
              isReadOnly={isReadOnly}
              isRemoving={removingExpense}
            />

            <Separator />

            {/* Cancelled Bookings Section */}
            <EditableCancelledBookingsSection
              cancelledBookings={cancelledBookings}
              isLoading={isLoadingCancelled}
              onToggleInclude={handleToggleCancelledBooking}
              isReadOnly={isReadOnly}
              isUpdating={updatingCancelledBooking}
            />

            <Separator />

            {/* Invoice Total Summary */}
            <InvoiceTotalSummary
              lineItemsTotal={lineItemsTotal}
              expensesTotal={expensesTotal}
              extraTimeTotal={extraTimeTotals.totalCost}
              extraTimeFormatted={extraTimeTotals.formattedTime}
              cancelledBookingFees={cancelledBookingFees}
              vatPercentage={watch('tax_percentage') || 0}
            />

            <Separator />

            {/* Notes Section */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Notes</h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Client-visible Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Additional notes for this invoice (visible to client)"
                  rows={3}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Refresh data
                toast.info('Refreshing invoice data...');
              }}
              disabled={isSubmitting}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || isReadOnly}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
