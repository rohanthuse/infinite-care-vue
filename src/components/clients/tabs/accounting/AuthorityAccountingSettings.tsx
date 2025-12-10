import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useClientAccountingSettings, useCreateOrUpdateClientAccountingSettings } from '@/hooks/useClientAccounting';
import { useTenant } from '@/contexts/TenantContext';
import { ChargeBasedOn, chargeBasedOnLabels } from '@/types/clientAccounting';

const authorityAccountingSchema = z.object({
  authority_invoice_config: z.string().optional(),
  charge_based_on: z.enum(['planned_time', 'actual_time']).default('planned_time'),
  credit_period_days: z.number().min(0).default(14),
  consolidation_preference: z.enum(['single', 'split_by_client']).default('single'),
  contract_reference: z.string().optional(),
  contract_notes: z.string().optional()
});

type AuthorityAccountingFormData = z.infer<typeof authorityAccountingSchema>;

interface AuthorityAccountingSettingsProps {
  clientId: string;
  branchId: string;
}

export const AuthorityAccountingSettings: React.FC<AuthorityAccountingSettingsProps> = ({
  clientId,
  branchId
}) => {
  const { organization } = useTenant();
  const { data: settings, isLoading: settingsLoading } = useClientAccountingSettings(clientId);
  const updateSettings = useCreateOrUpdateClientAccountingSettings();

  const form = useForm<AuthorityAccountingFormData>({
    resolver: zodResolver(authorityAccountingSchema),
    defaultValues: {
      authority_invoice_config: '',
      charge_based_on: 'planned_time',
      credit_period_days: 14,
      consolidation_preference: 'single',
      contract_reference: '',
      contract_notes: ''
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        authority_invoice_config: settings.authority_invoice_config || '',
        charge_based_on: 'planned_time', // Authority default
        credit_period_days: 14, // Authority default
        consolidation_preference: settings.consolidation_preference || 'single',
        contract_reference: settings.contract_reference || '',
        contract_notes: settings.contract_notes || ''
      });
    }
  }, [settings, form]);

  const onSubmit = (data: AuthorityAccountingFormData) => {
    // Sanitize UUID fields - convert empty strings to null for database
    const sanitizedBranchId = branchId && branchId.trim() !== '' ? branchId : null;
    const sanitizedOrganizationId = organization?.id && organization.id.trim() !== '' ? organization.id : null;
    
    updateSettings.mutate({
      client_id: clientId,
      branch_id: sanitizedBranchId,
      organization_id: sanitizedOrganizationId,
      // Preserve existing settings
      show_in_task_matrix: settings?.show_in_task_matrix || false,
      show_in_form_matrix: settings?.show_in_form_matrix || false,
      enable_geo_fencing: settings?.enable_geo_fencing || false,
      invoice_method: settings?.invoice_method || 'per_visit',
      invoice_display_type: settings?.invoice_display_type || 'per_visit',
      billing_address_same_as_personal: settings?.billing_address_same_as_personal ?? true,
      rate_type: settings?.rate_type || 'standard',
      mileage_rule_no_payment: settings?.mileage_rule_no_payment || false,
      service_payer: settings?.service_payer || 'authorities',
      // Authority-specific settings
      authority_invoice_config: data.authority_invoice_config,
      consolidation_preference: data.consolidation_preference,
      contract_reference: data.contract_reference,
      contract_notes: data.contract_notes,
      // Override with authority defaults
      ...data
    });
  };

  if (settingsLoading) {
    return <div>Loading authority accounting settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Authority Contract Settings</CardTitle>
        <CardDescription>
          Configure authority billing and contract preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="authority_invoice_config"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authority Invoice Configuration</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select configuration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard Authority Invoice</SelectItem>
                        <SelectItem value="detailed">Detailed Ledger</SelectItem>
                        <SelectItem value="consolidated">Consolidated Summary</SelectItem>
                        <SelectItem value="custom">Custom Template</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consolidation_preference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Consolidation</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select consolidation type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single">Consolidated Invoice</SelectItem>
                        <SelectItem value="split_by_client">Split by Client</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credit_period_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Period (Days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="14"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 14)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="Contract reference number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="charge_based_on"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Based On</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-row space-x-6"
                      >
                        {Object.entries(chargeBasedOnLabels).map(([value, label]) => (
                          <div key={value} className="flex items-center space-x-2">
                            <RadioGroupItem value={value} id={`authority-charge-${value}`} />
                            <Label htmlFor={`authority-charge-${value}`}>{label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Additional contract notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateSettings.isPending}
                className="bg-success text-success-foreground hover:bg-success/90"
              >
                {updateSettings.isPending ? 'Saving...' : 'Save Authority Settings'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};