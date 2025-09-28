import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Lock, Unlock, Edit3, RotateCcw, Calculator } from "lucide-react";
import { useInvoiceWithLedger, useGenerateLedger, useUpdateLineItem, useLockLedger, formatHoursMinutes, formatRateType, formatDayType, type LedgerLineItem } from "@/hooks/useLedgerInvoicing";
import { format } from "date-fns";

interface InvoiceLedgerViewProps {
  invoiceId: string;
  onClose?: () => void;
}

export function InvoiceLedgerView({ invoiceId, onClose }: InvoiceLedgerViewProps) {
  const [editingItem, setEditingItem] = useState<LedgerLineItem | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<LedgerLineItem>>({});

  const { data: invoice, isLoading } = useInvoiceWithLedger(invoiceId);
  const generateLedger = useGenerateLedger();
  const updateLineItem = useUpdateLineItem();
  const lockLedger = useLockLedger();

  const handleGenerateLedger = () => {
    if (!invoice?.clients || !invoice.start_date || !invoice.end_date) return;
    
    generateLedger.mutate({
      invoiceId: invoice.id,
      clientId: invoice.client_id,
      startDate: invoice.start_date,
      endDate: invoice.end_date
    });
  };

  const handleEditLineItem = (item: LedgerLineItem) => {
    setEditingItem(item);
    setEditFormData({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total
    });
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editFormData) return;

    // Recalculate line total if quantity or unit price changed
    const updatedData = {
      ...editFormData,
      line_total: (editFormData.quantity || 0) * (editFormData.unit_price || 0)
    };

    updateLineItem.mutate({
      lineItemId: editingItem.id,
      updates: updatedData
    });
    setEditingItem(null);
    setEditFormData({});
  };

  const handleToggleLock = () => {
    if (!invoice) return;
    
    lockLedger.mutate({
      invoiceId: invoice.id,
      isLocked: !invoice.is_ledger_locked
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading invoice details...</div>;
  }

  if (!invoice) {
    return <div className="text-center text-muted-foreground">Invoice not found</div>;
  }

  const client = invoice.clients;
  const lineItems = invoice.line_items || [];
  
  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.line_total || 0), 0);
  const vatAmount = invoice.vat_amount || 0;
  const totalDue = invoice.total_amount || (subtotal + vatAmount);
  const totalHours = formatHoursMinutes(invoice.total_invoiced_hours_minutes);

  return (
    <div className="space-y-6">
      {/* Invoice Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Invoice Ledger View</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateLedger}
                disabled={generateLedger.isPending || invoice.is_ledger_locked}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Regenerate Ledger
              </Button>
              <Button
                variant={invoice.is_ledger_locked ? "destructive" : "outline"}
                size="sm"
                onClick={handleToggleLock}
                disabled={lockLedger.isPending}
              >
                {invoice.is_ledger_locked ? (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Unlock Ledger
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Lock Ledger
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Client Details */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Client Details</h3>
              <p className="font-medium">{client?.first_name} {client?.last_name}</p>
              <p className="text-sm text-muted-foreground">{client?.email}</p>
              {invoice.authority_type && (
                <Badge variant="secondary" className="mt-1">{invoice.authority_type}</Badge>
              )}
            </div>

            {/* Invoice Info */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Invoice Details</h3>
              <p className="font-medium">#{invoice.invoice_number}</p>
              <p className="text-sm">Date: {format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}</p>
              <p className="text-sm">Due: {format(new Date(invoice.due_date), 'dd/MM/yyyy')}</p>
              <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="mt-1">
                {invoice.status}
              </Badge>
            </div>

            {/* Invoice Period */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Invoice Period</h3>
              {invoice.start_date && invoice.end_date ? (
                <>
                  <p className="text-sm">From: {format(new Date(invoice.start_date), 'dd/MM/yyyy')}</p>
                  <p className="text-sm">To: {format(new Date(invoice.end_date), 'dd/MM/yyyy')}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No period set</p>
              )}
            </div>

            {/* Summary Totals */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Summary</h3>
              <p className="text-sm">Net Amount: <span className="font-medium">£{subtotal.toFixed(2)}</span></p>
              <p className="text-sm">VAT: <span className="font-medium">£{vatAmount.toFixed(2)}</span></p>
              <p className="font-medium">Total Due: <span className="text-lg">£{totalDue.toFixed(2)}</span></p>
              <p className="text-sm text-muted-foreground">Total Hours: {totalHours}</p>
            </div>
          </div>

          {invoice.is_ledger_locked && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  This ledger is locked and cannot be modified.
                </span>
                {invoice.locked_at && (
                  <span className="text-xs text-yellow-600">
                    Locked on {format(new Date(invoice.locked_at), 'dd/MM/yyyy HH:mm')}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visit Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Ledger - Detailed Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            Each line represents a service delivery instance with applied rates and calculations.
          </p>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No ledger items found.</p>
              <Button onClick={handleGenerateLedger} disabled={generateLedger.isPending}>
                <Calculator className="w-4 h-4 mr-2" />
                Generate Ledger from Visits
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Service Time</TableHead>
                    <TableHead>Rate Type</TableHead>
                    <TableHead className="text-right">Qty/Hrs</TableHead>
                    <TableHead className="text-right">Price/Rate</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{item.description}</p>
                          {item.visit_date && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{format(new Date(item.visit_date), 'EEE dd/MM/yyyy')}</span>
                              {item.day_type && <Badge variant="outline" className="text-xs">{formatDayType(item.day_type)}</Badge>}
                              {item.bank_holiday_multiplier_applied && item.bank_holiday_multiplier_applied > 1 && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.bank_holiday_multiplier_applied}x Rate
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.service_start_time && item.service_end_time ? (
                          <span className="text-sm font-mono">
                            {item.service_start_time}–{item.service_end_time}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatRateType(item.rate_type_applied)}</div>
                          {item.duration_minutes && (
                            <div className="text-xs text-muted-foreground">
                              Duration: {formatHoursMinutes(item.duration_minutes)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.rate_type_applied === 'hourly' 
                          ? (item.quantity || 0).toFixed(2)
                          : (item.quantity || 0).toString()
                        }
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        £{(item.unit_price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        £0.00
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        £{(item.line_total || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {!invoice.is_ledger_locked && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditLineItem(item)}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Line Item</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="description">Description</Label>
                                  <Input
                                    id="description"
                                    value={editFormData.description || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                      id="quantity"
                                      type="number"
                                      step="0.01"
                                      value={editFormData.quantity || ''}
                                      onChange={(e) => setEditFormData(prev => ({ 
                                        ...prev, 
                                        quantity: parseFloat(e.target.value) || 0,
                                        line_total: (parseFloat(e.target.value) || 0) * (prev.unit_price || 0)
                                      }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="unit_price">Unit Price</Label>
                                    <Input
                                      id="unit_price"
                                      type="number"
                                      step="0.01"
                                      value={editFormData.unit_price || ''}
                                      onChange={(e) => setEditFormData(prev => ({ 
                                        ...prev, 
                                        unit_price: parseFloat(e.target.value) || 0,
                                        line_total: (prev.quantity || 0) * (parseFloat(e.target.value) || 0)
                                      }))}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>Line Total: £{((editFormData.quantity || 0) * (editFormData.unit_price || 0)).toFixed(2)}</Label>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setEditingItem(null);
                                      setEditFormData({});
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={handleSaveEdit} disabled={updateLineItem.isPending}>
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals Summary */}
              <div className="mt-6 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Net Amount:</span>
                  <span className="font-mono">£{subtotal.toFixed(2)}</span>
                </div>
                {vatAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>VAT (20%):</span>
                    <span className="font-mono">£{vatAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Total Invoiced Hours:</span>
                  <span className="font-mono">{totalHours}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total Due:</span>
                  <span className="font-mono">£{totalDue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}