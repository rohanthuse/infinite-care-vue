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
import { useClientPrivateAccounting, useCreateOrUpdateClientPrivateAccounting } from '@/hooks/useClientAccounting';
import { useTravelRates } from '@/hooks/useTravelRates';
import { ChargeBasedOn, chargeBasedOnLabels } from '@/types/clientAccounting';

const privateAccountingSchema = z.object({
  private_invoice_config: z.string().optional(),
  charge_based_on: z.enum(['planned_time', 'actual_time']).default('planned_time'),
  extra_time_calculation: z.boolean().default(false),
  travel_rate_id: z.string().optional(),
  credit_period_days: z.number().min(0).default(0)
});

type PrivateAccountingFormData = z.infer<typeof privateAccountingSchema>;

interface PrivateAccountingSettingsProps {
  clientId: string;
  branchId: string;
  organizationId?: string;
}

export const PrivateAccountingSettings: React.FC<PrivateAccountingSettingsProps> = ({
  clientId,
  branchId,
  organizationId,
}) => {
  const { data: settings, isLoading: settingsLoading } = useClientPrivateAccounting(clientId);
  const { data: travelRates } = useTravelRates(branchId);
  const updateSettings = useCreateOrUpdateClientPrivateAccounting();

  const form = useForm<PrivateAccountingFormData>({
    resolver: zodResolver(privateAccountingSchema),
    defaultValues: {
      private_invoice_config: '',
      charge_based_on: 'planned_time',
      extra_time_calculation: false,
      travel_rate_id: '',
      credit_period_days: 0
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        private_invoice_config: settings.private_invoice_config || '',
        charge_based_on: settings.charge_based_on,
        extra_time_calculation: settings.extra_time_calculation,
        travel_rate_id: settings.travel_rate_id || '',
        credit_period_days: settings.credit_period_days
      });
    }
  }, [settings, form]);

  const onSubmit = (data: PrivateAccountingFormData) => {
    // Sanitize all UUID fields - convert empty strings to null for database
    const sanitizedBranchId = branchId && branchId.trim() !== '' ? branchId : null;
    const sanitizedOrganizationId = organizationId && organizationId.trim() !== '' ? organizationId : null;
    const sanitizedTravelRateId = data.travel_rate_id && data.travel_rate_id.trim() !== '' ? data.travel_rate_id : null;
    const sanitizedPrivateInvoiceConfig = data.private_invoice_config && data.private_invoice_config.trim() !== '' ? data.private_invoice_config : null;
    
    updateSettings.mutate({
      client_id: clientId,
      branch_id: sanitizedBranchId,
      organization_id: sanitizedOrganizationId,
      charge_based_on: data.charge_based_on || 'planned_time',
      extra_time_calculation: data.extra_time_calculation || false,
      credit_period_days: data.credit_period_days || 0,
      private_invoice_config: sanitizedPrivateInvoiceConfig,
      travel_rate_id: sanitizedTravelRateId,
    });
  };

  if (settingsLoading) {
    return <div>Loading private accounting settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Private Accounting Settings</CardTitle>
        <CardDescription>
          Configure private client billing and accounting preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="private_invoice_config"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Private Invoice Configuration</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select configuration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard Invoice</SelectItem>
                        <SelectItem value="detailed">Detailed Invoice</SelectItem>
                        <SelectItem value="summary">Summary Invoice</SelectItem>
                        <SelectItem value="custom">Custom Template</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="travel_rate_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Travel Rate</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select travel rate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {travelRates?.map((rate) => (
                          <SelectItem key={rate.id} value={rate.id}>
                            {rate.title} - £{rate.rate_per_mile}/mile
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
                name="credit_period_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Period (Days) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
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
                    <FormLabel>Do you want to charge based on Planned Time or Actual Time?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-row space-x-6"
                      >
                        {Object.entries(chargeBasedOnLabels).map(([value, label]) => (
                          <div key={value} className="flex items-center space-x-2">
                            <RadioGroupItem value={value} id={`charge-${value}`} />
                            <Label htmlFor={`charge-${value}`}>{label}</Label>
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
                name="extra_time_calculation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Do you want to calculate extra time?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === 'true')}
                        value={field.value ? 'true' : 'false'}
                        className="flex flex-row space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="extra-time-yes" />
                          <Label htmlFor="extra-time-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="extra-time-no" />
                          <Label htmlFor="extra-time-no">No</Label>
                        </div>
                      </RadioGroup>
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
                {updateSettings.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};