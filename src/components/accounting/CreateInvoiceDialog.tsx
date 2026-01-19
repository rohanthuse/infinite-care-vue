import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Calculator, Plus, Trash2, Save, Send, CheckCircle } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/currencyFormatter";
import { useCreateEnhancedInvoice } from "@/hooks/useEnhancedClientBilling";
import { useGenerateLedger } from "@/hooks/useLedgerInvoicing";
import { VisitSelectionModal } from "./VisitSelectionModal";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  clientId?: string;
  onInvoiceCreated?: (invoiceId: string) => void;
}

interface InvoiceLineItem {
  id?: string;
  description: string;
  rateType: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  visitDate?: string;
  dayType?: string;
  serviceStartTime?: string;
  serviceEndTime?: string;
  durationMinutes?: number;
  visitRecordId?: string;
  isVatable?: boolean;
  vatRate?: number; // VAT percentage from rate configuration
}

type InvoiceStatus = 'draft' | 'ready_to_charge' | 'confirmed' | 'deleted';
type InvoiceMethod = 'per_visit' | 'weekly' | 'monthly';

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  branchId,
  clientId,
  onInvoiceCreated
}: CreateInvoiceDialogProps) {
  const [formData, setFormData] = useState({
    clientId: clientId || "",
    invoiceNumber: "",
    currency: "GBP" as const,
    invoiceDate: new Date(),
    dueDate: addDays(new Date(), 30),
    authorityType: "",
    invoiceMethod: "per_visit" as InvoiceMethod,
    paymentTerms: 30,
    status: "draft" as InvoiceStatus,
    description: "",
    notes: "",
    termsTitle: "Standard Terms & Conditions",
    termsDescription: "Payment due within specified terms. Late payment charges may apply.",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined
  });

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [visitSelectionOpen, setVisitSelectionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const createInvoice = useCreateEnhancedInvoice();
  const generateLedger = useGenerateLedger();

  // Auto-generate invoice number on open
  useEffect(() => {
    if (open && !formData.invoiceNumber) {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setFormData(prev => ({ 
        ...prev, 
        invoiceNumber: `INV-${year}${month}${day}-${sequence}`
      }));
    }
  }, [open, formData.invoiceNumber]);

  // Auto-calculate due date when payment terms change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      dueDate: addDays(prev.invoiceDate, prev.paymentTerms)
    }));
  }, [formData.paymentTerms, formData.invoiceDate]);

  // Calculate summary - use rate's VAT configuration instead of hardcoded 20%
  const netAmount = lineItems.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = lineItems.reduce((sum, item) => {
    // Only apply VAT if item is vatable, use configured rate or default to 20%
    if (item.isVatable === false) return sum;
    const vatRate = item.vatRate ?? 20; // Default to 20% if not specified
    return sum + (item.total * (vatRate / 100));
  }, 0);
  const totalInvoicedMinutes = lineItems.reduce((sum, item) => sum + (item.durationMinutes || 0), 0);
  const totalDue = netAmount + vatAmount;

  const formatHoursMinutes = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleAddVisits = (visits: any[]) => {
    const newLineItems: InvoiceLineItem[] = visits.map(visit => ({
      description: `${visit.dayType} – ${format(new Date(visit.visitDate), 'dd/MM/yyyy')} ${visit.serviceStartTime}–${visit.serviceEndTime}`,
      rateType: visit.rateType,
      quantity: visit.durationMinutes / 60, // Convert to hours
      unitPrice: visit.rate,
      discount: 0,
      total: visit.total,
      visitDate: visit.visitDate,
      dayType: visit.dayType,
      serviceStartTime: visit.serviceStartTime,
      serviceEndTime: visit.serviceEndTime,
      durationMinutes: visit.durationMinutes,
      visitRecordId: visit.visitRecordId,
      isVatable: visit.isVatable ?? true, // Default to vatable if not specified
      vatRate: visit.vatRate // Use rate's VAT percentage
    }));

    setLineItems(prev => [...prev, ...newLineItems]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    await handleSubmit('draft');
  };

  const handleConfirmInvoice = async () => {
    await handleSubmit('confirmed');
  };

  const handleSubmit = async (status: InvoiceStatus) => {
    if (!formData.clientId || !formData.invoiceNumber || !formData.invoiceDate || !formData.dueDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (lineItems.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please add at least one line item",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const invoiceData = {
        client_id: formData.clientId,
        description: formData.description,
        invoice_number: formData.invoiceNumber,
        invoice_date: format(formData.invoiceDate, 'yyyy-MM-dd'),
        due_date: format(formData.dueDate, 'yyyy-MM-dd'),
        tax_amount: vatAmount,
        currency: formData.currency,
        payment_terms: `${formData.paymentTerms} days`,
        notes: formData.notes,
        line_items: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_amount: item.discount
        }))
      };

      const invoice = await createInvoice.mutateAsync(invoiceData);
      
      // Update invoice status if not draft
      if (status !== 'draft') {
        // Update status logic would go here
      }

      toast({
        title: "Invoice Created",
        description: `Invoice ${formData.invoiceNumber} has been ${status === 'draft' ? 'saved as draft' : 'confirmed'} successfully.`,
      });

      onInvoiceCreated?.(invoice.id);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        clientId: clientId || "",
        invoiceNumber: "",
        currency: "GBP",
        invoiceDate: new Date(),
        dueDate: addDays(new Date(), 30),
        authorityType: "",
        invoiceMethod: "per_visit",
        paymentTerms: 30,
        status: "draft",
        description: "",
        notes: "",
        termsTitle: "Standard Terms & Conditions",
        termsDescription: "Payment due within specified terms. Late payment charges may apply.",
        startDate: undefined,
        endDate: undefined
      });
      setLineItems([]);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const variants = {
      draft: "secondary",
      ready_to_charge: "default",
      confirmed: "default",
      deleted: "destructive"
    } as const;

    const labels = {
      draft: "Draft",
      ready_to_charge: "Ready to Charge", 
      confirmed: "Confirmed",
      deleted: "Deleted"
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Generate Invoice
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Invoice Header */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Invoice Header</h3>
                {getStatusBadge(formData.status)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invoice-number">Invoice Number *</Label>
                  <Input
                    id="invoice-number"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    placeholder="INV-2024-001"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value as "GBP" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">£ GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="invoice-method">Invoice Method</Label>
                  <Select
                    value={formData.invoiceMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, invoiceMethod: value as InvoiceMethod }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_visit">Per Visit</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invoice-date">Invoice Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.invoiceDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.invoiceDate}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, invoiceDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="due-date">Due Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.dueDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, dueDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="payment-terms">Payment Terms (days)</Label>
                  <Input
                    id="payment-terms"
                    type="number"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: parseInt(e.target.value) || 30 }))}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="authority-type">Authority / Client</Label>
                  <Input
                    id="authority-type"
                    value={formData.authorityType}
                    onChange={(e) => setFormData(prev => ({ ...prev, authorityType: e.target.value }))}
                    placeholder="e.g., Local Authority, NHS, Private"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as InvoiceStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ready_to_charge">Ready to Charge</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="deleted">Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Invoice Ledger */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Invoice Ledger (Visit-Based Line Items)</h3>
                <Button
                  onClick={() => setVisitSelectionOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Visit / Service
                </Button>
              </div>

              {lineItems.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Rate Type</TableHead>
                        <TableHead>Qty/Hrs</TableHead>
                        <TableHead>Price/Rate</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell>{item.rateType}</TableCell>
                          <TableCell>{formatHoursMinutes(item.durationMinutes || 0)}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell>{formatCurrency(item.discount)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(item.total)}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleRemoveLineItem(index)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No line items added yet. Click "Add Visit / Service" to get started.
                </div>
              )}
            </div>

            {/* Invoice Summary */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="text-lg font-semibold">Invoice Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Net Amount</Label>
                  <div className="text-xl font-bold">{formatCurrency(netAmount)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">VAT Amount</Label>
                  <div className="text-xl font-bold">{formatCurrency(vatAmount)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Invoiced Hours</Label>
                  <div className="text-xl font-bold">{formatHoursMinutes(totalInvoicedMinutes)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Due</Label>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(totalDue)}</div>
                </div>
              </div>
            </div>

            {/* Additional Fields */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              
              <div>
                <Label htmlFor="description">Description / Notes</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Care services provided during invoice period..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="terms-title">Terms Title</Label>
                  <Input
                    id="terms-title"
                    value={formData.termsTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsTitle: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="terms-description">Terms Description</Label>
                  <Input
                    id="terms-description"
                    value={formData.termsDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsDescription: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Internal notes (not visible to client)..."
                  rows={2}
                />
              </div>
            </div>

            {/* Buttons & Workflow */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </Button>
                
                <Button
                  onClick={handleConfirmInvoice}
                  disabled={isSubmitting || lineItems.length === 0}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm Invoice
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VisitSelectionModal
        open={visitSelectionOpen}
        onOpenChange={setVisitSelectionOpen}
        branchId={branchId}
        clientId={formData.clientId}
        onVisitsSelected={handleAddVisits}
      />
    </>
  );
}