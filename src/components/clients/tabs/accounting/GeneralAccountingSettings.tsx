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
import { useStaffByBranch } from '@/hooks/useStaff';
import { useClientAccountingSettings, useCreateOrUpdateClientAccountingSettings } from '@/hooks/useClientAccounting';
import { 
  InvoiceMethod, 
  RateCategory, 
  ServicePayer,
  invoiceMethodLabels,
  rateCategoryLabels,
  servicePayerLabels
} from '@/types/clientAccounting';

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
  rate_type: z.enum(['standard', 'adult', 'cyp']).default('standard'),
  mileage_rule_no_payment: z.boolean().default(false),
  service_payer: z.enum(['authorities', 'direct_payment', 'self_funder', 'other']).default('authorities')
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
  const { data: settings, isLoading: settingsLoading } = useClientAccountingSettings(clientId);
  const { data: staff } = useStaffByBranch(branchId);
  const updateSettings = useCreateOrUpdateClientAccountingSettings();

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
      rate_type: 'standard',
      mileage_rule_no_payment: false,
      service_payer: 'authorities'
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        care_lead_id: settings.care_lead_id || '',
        agreement_type: settings.agreement_type || '',
        expiry_date: settings.expiry_date || '',
        show_in_task_matrix: settings.show_in_task_matrix,
        show_in_form_matrix: settings.show_in_form_matrix,
        enable_geo_fencing: settings.enable_geo_fencing,
        invoice_method: settings.invoice_method,
        invoice_display_type: settings.invoice_display_type,
        billing_address_same_as_personal: settings.billing_address_same_as_personal,
        pay_method: settings.pay_method || '',
        rate_type: settings.rate_type,
        mileage_rule_no_payment: settings.mileage_rule_no_payment,
        service_payer: settings.service_payer
      });
    }
  }, [settings, form]);

  const onSubmit = (data: GeneralSettingsFormData) => {
    updateSettings.mutate({
      client_id: clientId,
      branch_id: branchId,
      ...data
    });
  };

  if (settingsLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <FormControl>
                      <Input placeholder="Select payment method" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(rateCategoryLabels).map(([value, label]) => (
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