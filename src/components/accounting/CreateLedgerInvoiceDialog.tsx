import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Calculator } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useGenerateLedger } from "@/hooks/useLedgerInvoicing";

interface CreateLedgerInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  clientId?: string;
  onInvoiceCreated?: (invoiceId: string) => void;
}

export function CreateLedgerInvoiceDialog({
  open,
  onOpenChange,
  branchId,
  clientId,
  onInvoiceCreated
}: CreateLedgerInvoiceDialogProps) {
  const [formData, setFormData] = useState({
    clientId: clientId || "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    dueDate: undefined as Date | undefined,
    description: "",
    authorityType: "",
    paymentTerms: "30 days",
    notes: "",
    currency: "GBP"
  });
  const [creating, setCreating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const generateLedger = useGenerateLedger();

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    return `INV-${year}${month}${day}-${time}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.startDate || !formData.endDate || !formData.dueDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);

    try {
      // Get organization ID from branch
      const { data: branch } = await supabase
        .from('branches')
        .select('organization_id')
        .eq('id', branchId)
        .single();

      if (!branch) {
        throw new Error('Branch not found');
      }

      // Create the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('client_billing')
        .insert({
          client_id: formData.clientId,
          organization_id: branch.organization_id,
          invoice_number: generateInvoiceNumber(),
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: formData.dueDate.toISOString().split('T')[0],
          start_date: formData.startDate.toISOString().split('T')[0],
          end_date: formData.endDate.toISOString().split('T')[0],
          description: formData.description,
          authority_type: formData.authorityType || null,
          payment_terms: formData.paymentTerms,
          notes: formData.notes || null,
          currency: formData.currency,
          status: 'draft',
          amount: 0, // Will be calculated by ledger generation
          total_amount: 0,
          net_amount: 0,
          vat_amount: 0,
          invoice_type: 'ledger_based'
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Generate ledger from visit records
      generateLedger.mutate({
        invoiceId: invoice.id,
        clientId: formData.clientId,
        startDate: formData.startDate.toISOString().split('T')[0],
        endDate: formData.endDate.toISOString().split('T')[0]
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
          toast({
            title: "Invoice Created",
            description: "Ledger-based invoice has been created successfully with automated visit breakdown.",
          });
          
          onInvoiceCreated?.(invoice.id);
          onOpenChange(false);
          
          // Reset form
          setFormData({
            clientId: clientId || "",
            startDate: undefined,
            endDate: undefined,
            dueDate: undefined,
            description: "",
            authorityType: "",
            paymentTerms: "30 days",
            notes: "",
            currency: "GBP"
          });
        },
        onError: (error) => {
          console.error('Ledger generation failed:', error);
          // Invoice created but ledger generation failed
          toast({
            title: "Invoice Created",
            description: "Invoice created but ledger generation encountered an issue. You can regenerate it from the invoice view.",
            variant: "destructive"
          });
          onInvoiceCreated?.(invoice.id);
          onOpenChange(false);
        }
      });

    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Create Ledger-Based Invoice
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Generate an invoice with automated visit ledger based on actual service delivery records.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Period */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Invoice Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="end-date">End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="due-date">Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dueDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="payment-terms">Payment Terms</Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="7 days">7 days</SelectItem>
                    <SelectItem value="14 days">14 days</SelectItem>
                    <SelectItem value="30 days">30 days</SelectItem>
                    <SelectItem value="60 days">60 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authority-type">Authority Type</Label>
                <Input
                  id="authority-type"
                  value={formData.authorityType}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorityType: e.target.value }))}
                  placeholder="e.g., Local Authority, NHS, Private"
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Care services for invoice period"
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes for the invoice..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || generateLedger.isPending}
              className="min-w-[140px]"
            >
              {creating || generateLedger.isPending ? (
                <>
                  <Calculator className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Create Invoice
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}