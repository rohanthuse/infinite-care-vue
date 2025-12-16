import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, User, Building2, Settings } from 'lucide-react';
import { useClientFundingInfo } from '@/hooks/useClientFunding';
import { useCreateEnhancedInvoice, useClientsByAuthority } from '@/hooks/useAuthorityBilling';
import { useClientServicePayer, getServicePayerConfig, servicePayerLabels } from '@/hooks/useClientServicePayer';
import { BillToSelector } from './BillToSelector';
import { AuthoritySelector } from './AuthoritySelector';
import { ConsolidationSelector } from './ConsolidationSelector';
import { EnhancedClientSelector } from '@/components/ui/enhanced-client-selector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/utils/currencyFormatter';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedCreateInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  organizationId: string;
  preSelectedClientId?: string;
  invoiceId?: string;
  invoicePeriod?: {
    type: 'weekly' | 'fortnightly' | 'monthly' | 'custom';
    startDate: string;
    endDate: string;
  };
}

export const EnhancedCreateInvoiceDialog = ({
  isOpen,
  onClose,
  branchId,
  organizationId,
  preSelectedClientId,
  invoiceId,
  invoicePeriod
}: EnhancedCreateInvoiceDialogProps) => {
  const [billToType, setBillToType] = useState<'authority' | 'private'>('private');
  const [selectedClientId, setSelectedClientId] = useState(preSelectedClientId || '');
  const [selectedAuthorityId, setSelectedAuthorityId] = useState('');
  const [consolidationType, setConsolidationType] = useState<'single' | 'split_by_client'>('single');
  const [step, setStep] = useState<'client_selection' | 'bill_to' | 'entity_selection' | 'invoice_details'>('client_selection');

  // Form data
  const [formData, setFormData] = useState({
    description: invoicePeriod 
      ? `${invoicePeriod.type.charAt(0).toUpperCase() + invoicePeriod.type.slice(1)} Invoice (${invoicePeriod.startDate} to ${invoicePeriod.endDate})`
      : '',
    amount: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: invoicePeriod 
      ? `Invoice period: ${invoicePeriod.startDate} to ${invoicePeriod.endDate}`
      : '',
    start_date: invoicePeriod?.startDate || '',
    end_date: invoicePeriod?.endDate || ''
  });

  const { data: clientFunding } = useClientFundingInfo(selectedClientId);
  const { data: servicePayerData, isLoading: isLoadingServicePayer } = useClientServicePayer(selectedClientId);
  const { data: authorityClients = [] } = useClientsByAuthority(selectedAuthorityId, branchId);
  const createInvoice = useCreateEnhancedInvoice();

  // Calculate service payer config based on client's accounting settings
  const servicePayerConfig = useMemo(() => {
    if (!selectedClientId || !servicePayerData) {
      return getServicePayerConfig(null);
    }
    return getServicePayerConfig(servicePayerData.service_payer);
  }, [selectedClientId, servicePayerData]);

  // Load existing invoice data for edit mode
  useEffect(() => {
    if (isOpen && invoiceId) {
      const loadInvoiceData = async () => {
        try {
          const { data, error } = await supabase
            .from('client_billing')
            .select('*')
            .eq('id', invoiceId)
            .single();

          if (error) throw error;

          if (data) {
            const billType = (data.bill_to_type === 'authority' ? 'authority' : 'private') as 'authority' | 'private';
            const consolidation = (data.consolidation_type === 'split_by_client' ? 'split_by_client' : 'single') as 'single' | 'split_by_client';
            
            setBillToType(billType);
            setSelectedClientId(data.client_id || '');
            setSelectedAuthorityId(data.authority_id || '');
            setConsolidationType(consolidation);
            setFormData({
              description: data.description || '',
              amount: data.amount?.toString() || '',
              invoice_date: data.invoice_date || new Date().toISOString().split('T')[0],
              due_date: data.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              notes: data.notes || '',
              start_date: data.start_date || '',
              end_date: data.end_date || ''
            });
            setStep('invoice_details');
          }
        } catch (error) {
          console.error('Error loading invoice:', error);
          toast.error('Failed to load invoice data');
        }
      };

      loadInvoiceData();
    }
  }, [isOpen, invoiceId]);

  // Auto-set billToType based on service_payer when client is selected
  useEffect(() => {
    if (selectedClientId && servicePayerData && servicePayerConfig.canProceed) {
      // Set default bill to type based on service payer setting
      if (servicePayerConfig.defaultBillTo) {
        setBillToType(servicePayerConfig.defaultBillTo);
      }
      
      // Pre-populate authority if available and authority billing is default
      if (servicePayerConfig.defaultBillTo === 'authority' && clientFunding?.authority_id) {
        setSelectedAuthorityId(clientFunding.authority_id);
      }
    }
  }, [selectedClientId, servicePayerData, servicePayerConfig, clientFunding]);

  // Auto-advance from client_selection to next step
  useEffect(() => {
    if (step === 'client_selection' && selectedClientId && !isLoadingServicePayer && servicePayerData) {
      if (servicePayerConfig.canProceed) {
        // Skip bill_to step if selector not needed (self_funder)
        if (!servicePayerConfig.showBillToSelector) {
          setStep('entity_selection');
        } else {
          setStep('bill_to');
        }
      }
    }
  }, [step, selectedClientId, isLoadingServicePayer, servicePayerData, servicePayerConfig]);

  // Auto-advance from bill_to to entity_selection
  useEffect(() => {
    if (step === 'bill_to' && billToType) {
      setStep('entity_selection');
    }
  }, [billToType, step]);

  // Auto-advance from entity_selection to invoice_details
  useEffect(() => {
    if (step === 'entity_selection') {
      if (billToType === 'private' && selectedClientId) {
        setStep('invoice_details');
      } else if (billToType === 'authority' && selectedAuthorityId && consolidationType) {
        setStep('invoice_details');
      }
    }
  }, [billToType, selectedClientId, selectedAuthorityId, consolidationType, step]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedClientId(preSelectedClientId || '');
      if (!preSelectedClientId) {
        setStep('client_selection');
      }
    } else {
      // Reset form
      setBillToType('private');
      setSelectedClientId('');
      setSelectedAuthorityId('');
      setConsolidationType('single');
      setStep('client_selection');
      setFormData({
        description: '',
        amount: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        start_date: '',
        end_date: ''
      });
    }
  }, [isOpen, preSelectedClientId]);

  const handleSubmit = async () => {
    try {
      const invoiceData = {
        bill_to_type: billToType,
        client_id: selectedClientId,
        authority_id: billToType === 'authority' ? selectedAuthorityId : null,
        consolidation_type: billToType === 'authority' ? consolidationType : null,
        description: formData.description,
        amount: parseFloat(formData.amount),
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        notes: formData.notes,
        organization_id: organizationId
      };

      await createInvoice.mutateAsync(invoiceData);
      onClose();
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const getServicePayerBadge = () => {
    if (!selectedClientId || !servicePayerData?.service_payer) return null;
    
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Who Pays:</span>
        <Badge variant="outline">
          {servicePayerLabels[servicePayerData.service_payer] || servicePayerData.service_payer}
        </Badge>
      </div>
    );
  };

  const getServicePayerBlockingAlert = () => {
    if (!selectedClientId || isLoadingServicePayer) return null;
    
    if (!servicePayerConfig.canProceed) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cannot Create Invoice:</strong> {servicePayerConfig.errorMessage}
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  const canProceedToNext = () => {
    switch (step) {
      case 'client_selection':
        return selectedClientId !== '' && servicePayerConfig.canProceed;
      case 'bill_to':
        return billToType !== null;
      case 'entity_selection':
        if (billToType === 'private') return selectedClientId !== '';
        if (billToType === 'authority') return selectedAuthorityId !== '' && consolidationType !== null;
        return false;
      case 'invoice_details':
        return formData.description && formData.amount && formData.invoice_date && formData.due_date;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {invoiceId ? 'Edit Invoice' : 'Generate Invoice'}
            <Badge variant="outline">{step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
            {invoicePeriod && (
              <Badge variant="secondary" className="ml-2">
                {invoicePeriod.type.charAt(0).toUpperCase() + invoicePeriod.type.slice(1)} Period
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 0: Client Selection (First Step) */}
          {step === 'client_selection' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Select Client</Label>
                <EnhancedClientSelector
                  branchId={branchId}
                  selectedClientId={selectedClientId}
                  onClientSelect={(clientId) => setSelectedClientId(clientId)}
                  placeholder="Search and select a client..."
                />
              </div>

              {/* Show service payer badge once client is selected */}
              {getServicePayerBadge()}

              {/* Show blocking alert if service payer not configured */}
              {getServicePayerBlockingAlert()}

              {/* Show auto-set billing info when not blocked */}
              {selectedClientId && servicePayerConfig.canProceed && !servicePayerConfig.showBillToSelector && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Based on client settings, this invoice will be billed to:
                  </p>
                  <Badge variant="secondary">
                    {billToType === 'private' ? 'Client (Self-Funder)' : 'Authority'}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Bill To Type Selection (shown only when showBillToSelector is true) */}
          {step === 'bill_to' && (
            <div className="space-y-4">
              {getServicePayerBadge()}
              <BillToSelector
                selectedType={billToType}
                onTypeChange={setBillToType}
              />
            </div>
          )}

          {/* Step 2: Entity Selection (Authority details when billing to authority) */}
          {step === 'entity_selection' && (
            <div className="space-y-4">
              {getServicePayerBadge()}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  {billToType === 'authority' ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {billToType === 'authority' ? 'Authority Invoice' : 'Private Invoice'}
                </Badge>
              </div>

              {billToType === 'authority' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Select Authority</Label>
                    <AuthoritySelector
                      branchId={branchId}
                      selectedAuthorityId={selectedAuthorityId}
                      onAuthoritySelect={(id, name) => setSelectedAuthorityId(id)}
                      placeholder="Search and select an authority..."
                    />
                  </div>

                  {selectedAuthorityId && authorityClients.length > 0 && (
                    <ConsolidationSelector
                      selectedType={consolidationType}
                      onTypeChange={setConsolidationType}
                      clientCount={authorityClients.length}
                    />
                  )}

                  {selectedAuthorityId && authorityClients.length === 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No clients found for this authority in the current branch.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Invoice Details */}
          {step === 'invoice_details' && (
            <div className="space-y-4">
              {/* Summary Badge */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                {billToType === 'authority' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                <div className="flex-1">
                  <div className="font-medium">
                    {billToType === 'authority' ? 'Authority Invoice' : 'Private Client Invoice'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {billToType === 'authority' 
                      ? `${consolidationType === 'single' ? 'Consolidated' : 'Split'} for ${authorityClients.length} clients`
                      : 'Direct client billing'
                    }
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('bill_to')}
                >
                  Change
                </Button>
              </div>

              {getServicePayerBadge()}

              <Separator />

              {/* Invoice Form Fields */}
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter invoice description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="text-lg font-semibold text-muted-foreground">
                      {formData.amount ? formatCurrency(parseFloat(formData.amount) || 0) : '£0.00'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoice_date">Invoice Date *</Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">Due Date *</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or comments..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div>
              {step !== 'client_selection' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (step === 'bill_to') setStep('client_selection');
                    if (step === 'entity_selection') {
                      // Go back to bill_to if selector was shown, otherwise to client_selection
                      setStep(servicePayerConfig.showBillToSelector ? 'bill_to' : 'client_selection');
                    }
                    if (step === 'invoice_details') setStep('entity_selection');
                  }}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {step !== 'invoice_details' && (
                <Button
                  onClick={() => {
                    if (step === 'client_selection') {
                      // Skip bill_to if selector not needed
                      if (!servicePayerConfig.showBillToSelector) {
                        setStep('entity_selection');
                      } else {
                        setStep('bill_to');
                      }
                    }
                    if (step === 'bill_to') setStep('entity_selection');
                    if (step === 'entity_selection') setStep('invoice_details');
                  }}
                  disabled={!canProceedToNext()}
                >
                  Next
                </Button>
              )}
              {step === 'invoice_details' && (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceedToNext() || createInvoice.isPending}
                >
                  {createInvoice.isPending ? 'Generating...' : 'Generate Invoice'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};