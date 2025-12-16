import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useBranchStaff } from '@/hooks/useBranchStaff';
import { useClientAccountingSettings, useCreateOrUpdateClientAccountingSettings } from '@/hooks/useClientAccounting';
import { useClientFundingInfo, useUpdateClientFunding } from '@/hooks/useClientFunding';
import { useTenant } from '@/contexts/TenantContext';
import { AuthoritySelector } from '@/components/accounting/AuthoritySelector';
import { 
  InvoiceMethod, 
  AuthorityCategory, 
  ServicePayer,
  invoiceMethodLabels,
  authorityCategoryLabels,
  servicePayerLabels
} from '@/types/clientAccounting';
import { fundingTypeLabels } from '@/types/billing';

const generalSettingsSchema = z.object({
  care_lead_id: z.string().optional(),
  agreement_type: z.string().optional(),
  expiry_date: z.string().optional(),
  show_in_task_matrix: z.boolean().default(false),
  show_in_form_matrix: z.boolean().default(false),
  enable_geo_fencing: z.boolean().default(false),
  invoice_method: z.enum(['per_visit', 'weekly', 'monthly']).default('per_visit'),
  invoice_display_type: z.string().default('per_visit'),
  billing_address_same_as_personal: z.boolean().default(true),
  pay_method: z.string().optional(),
  authority_category: z.enum(['private', 'local_authority', 'nhs', 'insurance', 'charity', 'other']).optional(),
  mileage_rule_no_payment: z.boolean().default(false),
  service_payer: z.enum(['authorities', 'direct_payment', 'self_funder', 'other']).default('authorities'),
  // Add funding type fields
  funding_type: z.enum(['private', 'authority']).default('private'),
  authority_id: z.string().optional()
}).refine((data) => {
  // If funding type is authority, authority_id is required
  if (data.funding_type === 'authority' && !data.authority_id) {
    return false;
  }
  return true;
}, {
  message: "Authority selection is required when funding type is Authority",
  path: ["authority_id"]
}).refine((data) => {
  // If service_payer is authorities, authority_category is required
  if (data.service_payer === 'authorities' && !data.authority_category) {
    return false;
  }
  return true;
}, {
  message: "Authority type is required when Authorities is selected",
  path: ["authority_category"]
});

type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;

interface GeneralAccountingSettingsProps {
  clientId: string;
  branchId: string;
}

export const GeneralAccountingSettings: React.FC<GeneralAccountingSettingsProps> = ({
  clientId,
  branchId
}) => {
  const { organization } = useTenant();
  const { data: settings, isLoading: settingsLoading } = useClientAccountingSettings(clientId);
  const { data: staff } = useBranchStaff(branchId);
  const { data: fundingInfo } = useClientFundingInfo(clientId);
  const updateSettings = useCreateOrUpdateClientAccountingSettings();
  const updateClientFunding = useUpdateClientFunding();

  const form = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      care_lead_id: '',
      agreement_type: '',
      expiry_date: '',
      show_in_task_matrix: false,
      show_in_form_matrix: false,
      enable_geo_fencing: false,
      invoice_method: 'per_visit',
      invoice_display_type: 'per_visit',
      billing_address_same_as_personal: true,
      pay_method: '',
      authority_category: 'private',
      mileage_rule_no_payment: false,
      service_payer: 'authorities',
      funding_type: 'private',
      authority_id: ''
    }
  });

  useEffect(() => {
    if (settings || fundingInfo) {
      form.reset({
        care_lead_id: settings?.care_lead_id || '',
        agreement_type: settings?.agreement_type || '',
        expiry_date: settings?.expiry_date || '',
        show_in_task_matrix: settings?.show_in_task_matrix || false,
        show_in_form_matrix: settings?.show_in_form_matrix || false,
        enable_geo_fencing: settings?.enable_geo_fencing || false,
        invoice_method: settings?.invoice_method || 'per_visit',
        invoice_display_type: settings?.invoice_display_type || 'per_visit',
        billing_address_same_as_personal: settings?.billing_address_same_as_personal ?? true,
        pay_method: settings?.pay_method || '',
        authority_category: (settings as any)?.authority_category || 'private',
        mileage_rule_no_payment: settings?.mileage_rule_no_payment || false,
        service_payer: settings?.service_payer || 'authorities',
        funding_type: fundingInfo?.funding_type || 'private',
        authority_id: fundingInfo?.authority_id || ''
      });
    }
  }, [settings, fundingInfo, form]);

  const onSubmit = async (data: GeneralSettingsFormData) => {
    try {
      // Sanitize UUID fields - convert empty strings to null/undefined
      const sanitizedAuthorityId = data.authority_id && data.authority_id.trim() !== '' ? data.authority_id : undefined;
      const currentAuthorityId = fundingInfo?.authority_id || undefined;
      
      // Check if funding info actually changed
      const fundingTypeChanged = data.funding_type !== (fundingInfo?.funding_type || 'private');
      const authorityIdChanged = sanitizedAuthorityId !== currentAuthorityId;
      
      // First update the funding type if it changed
      if (fundingTypeChanged || authorityIdChanged) {
        await updateClientFunding.mutateAsync({
          clientId,
          fundingType: data.funding_type,
          authorityId: sanitizedAuthorityId
        });
      }
      
      // Sanitize all UUID fields - convert empty strings to null for database
      const sanitizedCareLeadId = data.care_lead_id && data.care_lead_id.trim() !== '' ? data.care_lead_id : null;
      const sanitizedAgreementType = data.agreement_type && data.agreement_type.trim() !== '' ? data.agreement_type : null;
      const sanitizedExpiryDate = data.expiry_date && data.expiry_date.trim() !== '' ? data.expiry_date : null;
      const sanitizedPayMethod = data.pay_method && data.pay_method.trim() !== '' ? data.pay_method : null;
      const sanitizedBranchId = branchId && branchId.trim() !== '' ? branchId : null;
      
      // Sanitize organization_id as well
      const sanitizedOrganizationId = organization?.id && organization.id.trim() !== '' ? organization.id : null;
      
      updateSettings.mutate({
        client_id: clientId,
        branch_id: sanitizedBranchId,
        organization_id: sanitizedOrganizationId,
        care_lead_id: sanitizedCareLeadId,
        agreement_type: sanitizedAgreementType,
        expiry_date: sanitizedExpiryDate,
        show_in_task_matrix: data.show_in_task_matrix || false,
        show_in_form_matrix: data.show_in_form_matrix || false,
        enable_geo_fencing: data.enable_geo_fencing || false,
        invoice_method: data.invoice_method || 'per_visit',
        invoice_display_type: data.invoice_display_type || 'per_visit',
        billing_address_same_as_personal: data.billing_address_same_as_personal ?? true,
        pay_method: sanitizedPayMethod,
        // Only save authority_category when service_payer is 'authorities'
        authority_category: data.service_payer === 'authorities' ? (data.authority_category || 'private') : null,
        mileage_rule_no_payment: data.mileage_rule_no_payment || false,
        service_payer: data.service_payer || 'authorities',
      });
    } catch (error) {
      console.error('Error updating client settings:', error);
    }
  };

  const fundingType = form.watch('funding_type');
  const isAuthorityFunding = fundingType === 'authority';
  
  const servicePayer = form.watch('service_payer');
  const isAuthorityPayer = servicePayer === 'authorities';

  // Auto-sync funding_type when service_payer changes
  useEffect(() => {
    if (servicePayer === 'authorities') {
      form.setValue('funding_type', 'authority');
    } else if (servicePayer === 'self_funder') {
      form.setValue('funding_type', 'private');
    }
  }, [servicePayer, form]);

  if (settingsLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Funding Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funding Configuration</CardTitle>
            <CardDescription>Configure funding type and authority settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="funding_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Type *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-row space-x-6"
                      >
                        {Object.entries(fundingTypeLabels).map(([value, label]) => (
                          <div key={value} className="flex items-center space-x-2">
                            <RadioGroupItem value={value} id={`funding-${value}`} />
                            <Label htmlFor={`funding-${value}`}>{label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAuthorityFunding && (
                <FormField
                  control={form.control}
                  name="authority_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Authority *</FormLabel>
                      <FormControl>
                        <AuthoritySelector
                          branchId={branchId}
                          selectedAuthorityId={field.value}
                          onAuthoritySelect={(id, name) => field.onChange(id)}
                          placeholder="Select authority..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">General Settings</CardTitle>
            <CardDescription>Basic client configuration and visibility settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="care_lead_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Care Lead</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select care lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staff?.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreement_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agreement</FormLabel>
                    <FormControl>
                      <Input placeholder="Select agreement type" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="show_in_task_matrix"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Show in Task Matrix</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="show_in_form_matrix"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Show in Form Matrix</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enable_geo_fencing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enable Geo-Fencing</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === 'true')}
                        value={field.value ? 'true' : 'false'}
                        className="flex flex-row space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="geo-yes" />
                          <Label htmlFor="geo-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="geo-no" />
                          <Label htmlFor="geo-no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* General Accounting Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">General Accounting Settings</CardTitle>
            <CardDescription>Invoice and billing configuration settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoice_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select invoice method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(invoiceMethodLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoice_display_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Display Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Per Visit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pay_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="direct_debit">Direct Debit</SelectItem>
                        <SelectItem value="bacs">BACS</SelectItem>
                        <SelectItem value="faster_payment">Faster Payment</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="billing_address_same_as_personal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Address Same as Personal Address</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === 'true')}
                        value={field.value ? 'true' : 'false'}
                        className="flex flex-row space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="billing-yes" />
                          <Label htmlFor="billing-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="billing-no" />
                          <Label htmlFor="billing-no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mileage_rule_no_payment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>No mileage paid to staff when visiting this client</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_payer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who Pays for the Service</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        {Object.entries(servicePayerLabels).map(([value, label]) => (
                          <div key={value} className="flex items-center space-x-2">
                            <RadioGroupItem value={value} id={`payer-${value}`} />
                            <Label htmlFor={`payer-${value}`}>{label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAuthorityPayer && (
                <FormField
                  control={form.control}
                  name="authority_category"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Authorities</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select authority type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(authorityCategoryLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={updateSettings.isPending}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {updateSettings.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
};