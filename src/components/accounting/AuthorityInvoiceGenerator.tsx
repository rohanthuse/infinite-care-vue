import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthoritiesForBilling } from '@/hooks/useAuthorities';
import { useCreateEnhancedInvoice } from '@/hooks/useEnhancedClientBilling';
import { consolidationTypeLabels } from '@/types/billing';
import { FileText, Users } from 'lucide-react';
import { toast } from 'sonner';

interface AuthorityInvoiceGeneratorProps {
  availableClients: Array<{
    id: string;
    name: string;
    uninvoiced_hours: number;
    estimated_amount: number;
  }>;
  onInvoiceCreated?: () => void;
}

interface AuthorityInvoiceForm {
  authority_id: string;
  consolidation_type: 'single' | 'split_by_client';
  client_ids: string[];
  start_date: string;
  end_date: string;
  description: string;
}

export const AuthorityInvoiceGenerator: React.FC<AuthorityInvoiceGeneratorProps> = ({
  availableClients,
  onInvoiceCreated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<AuthorityInvoiceForm>({
    authority_id: '',
    consolidation_type: 'single',
    client_ids: [],
    start_date: '',
    end_date: '',
    description: ''
  });

  const { data: authorities = [] } = useAuthoritiesForBilling();
  const createInvoiceMutation = useCreateEnhancedInvoice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.authority_id || form.client_ids.length === 0) {
      toast.error('Please select an authority and at least one client');
      return;
    }

    try {
      // Calculate total amount from selected clients
      const totalAmount = availableClients
        .filter(client => form.client_ids.includes(client.id))
        .reduce((sum, client) => sum + client.estimated_amount, 0);

      const invoiceData = {
        bill_to_type: 'authority' as const,
        authority_id: form.authority_id,
        consolidation_type: form.consolidation_type,
        description: form.description,
        amount: totalAmount,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days
        start_date: form.start_date,
        end_date: form.end_date,
      };

      await createInvoiceMutation.mutateAsync(invoiceData);
      
      setIsOpen(false);
      setForm({
        authority_id: '',
        consolidation_type: 'single',
        client_ids: [],
        start_date: '',
        end_date: '',
        description: ''
      });
      
      onInvoiceCreated?.();
      toast.success('Authority invoice created successfully');
    } catch (error) {
      toast.error('Failed to create authority invoice');
    }
  };

  const handleClientToggle = (clientId: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      client_ids: checked 
        ? [...prev.client_ids, clientId]
        : prev.client_ids.filter(id => id !== clientId)
    }));
  };

  const selectedClients = availableClients.filter(client => form.client_ids.includes(client.id));
  const totalAmount = selectedClients.reduce((sum, client) => sum + client.estimated_amount, 0);
  const totalHours = selectedClients.reduce((sum, client) => sum + client.uninvoiced_hours, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Generate Authority Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Generate Authority Invoice</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Authority Selection */}
            <div className="space-y-2">
              <Label>Authority *</Label>
              <Select
                value={form.authority_id}
                onValueChange={(value) => setForm(prev => ({ ...prev, authority_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select authority" />
                </SelectTrigger>
                <SelectContent>
                  {authorities.map((authority) => (
                    <SelectItem key={authority.id} value={authority.id}>
                      {authority.name} ({authority.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Consolidation Type */}
            <div className="space-y-2">
              <Label>Invoice Type</Label>
              <Select
                value={form.consolidation_type}
                onValueChange={(value) => setForm(prev => ({ ...prev, consolidation_type: value as 'single' | 'split_by_client' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">{consolidationTypeLabels.single}</SelectItem>
                  <SelectItem value="split_by_client">{consolidationTypeLabels.split_by_client}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Period */}
            <div className="space-y-2">
              <Label>Service Period From</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Service Period To</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Invoice description"
            />
          </div>

          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Clients ({form.client_ids.length} selected)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availableClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={client.id}
                        checked={form.client_ids.includes(client.id)}
                        onCheckedChange={(checked) => handleClientToggle(client.id, checked as boolean)}
                      />
                      <div>
                        <Label htmlFor={client.id} className="font-medium cursor-pointer">
                          {client.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {client.uninvoiced_hours}h uninvoiced
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">£{client.estimated_amount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedClients.length > 0 && (
                <div className="mt-4 pt-4 border-t bg-muted/50 p-3 rounded">
                  <div className="flex justify-between items-center text-sm">
                    <span>Selected: {selectedClients.length} clients</span>
                    <span>{totalHours.toFixed(1)}h total</span>
                  </div>
                  <div className="flex justify-between items-center font-medium">
                    <span>Total Amount:</span>
                    <span>£{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!form.authority_id || form.client_ids.length === 0 || createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};