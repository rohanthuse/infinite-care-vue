import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Settings, PoundSterling, CreditCard } from "lucide-react";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { useBranchStaff } from "@/hooks/useBranchStaff";
import { useSignedAgreements } from "@/data/hooks/agreements";
import { useClientGeneralSettings } from "@/hooks/useClientGeneralSettings";
import { useUpdateClient } from "@/hooks/useUpdateClient";
import { toast } from "sonner";
import { 
  useClientAccountingSettings, 
  useCreateOrUpdateClientAccountingSettings 
} from '@/hooks/useClientAccounting';
import {
  invoiceMethodLabels,
  invoiceDisplayTypeLabels,
  servicePayerLabels,
  authorityCategoryLabels,
  InvoiceMethod,
  InvoiceDisplayType,
  ServicePayer,
  AuthorityCategory
} from '@/types/clientAccounting';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { PrivateAccountingSettings } from './accounting/PrivateAccountingSettings';

const formSchema = z.object({
  core_lead_id: z.string().nullable(),
  agreement_id: z.string().nullable(),
  expiry_date: z.date().nullable(),
  join_date: z.date().nullable(),
  show_in_task_matrix: z.boolean(),
  show_in_form_matrix: z.boolean(),
  enable_geo_fencing: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const accountingFormSchema = z.object({
  invoice_method: z.enum(['per_visit', 'weekly', 'monthly']),
  invoice_display_type: z.string(),
  billing_address_same_as_personal: z.boolean(),
  billing_address: z.string().nullable(),
  mileage_rule_no_payment: z.boolean(),
  service_payer: z.enum(['authorities', 'direct_payment', 'self_funder', 'other']),
  authority_category: z.enum(['private', 'local_authority', 'nhs', 'insurance', 'charity', 'other']).nullable(),
}).refine((data) => {
  if (data.service_payer === 'authorities') {
    return data.authority_category !== null;
  }
  return true;
}, {
  message: "Please select an authority category",
  path: ["authority_category"],
});

type AccountingFormValues = z.infer<typeof accountingFormSchema>;

interface GeneralTabProps {
  clientId: string;
  branchId?: string;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ clientId, branchId }) => {
  const [activeSubTab, setActiveSubTab] = useState("general-setting");
  
  // Fetch data
  const { data: settings, isLoading: settingsLoading } = useClientGeneralSettings(clientId);
  const { data: staffList = [], isLoading: staffLoading } = useBranchStaff(branchId || '');
  const { data: agreements = [], isLoading: agreementsLoading } = useSignedAgreements({
    branchId: branchId,
    searchQuery: '',
    typeFilter: 'all',
    dateFilter: 'all',
    partyFilter: 'all',
  });
  const { data: accountingSettings, isLoading: accountingLoading } = useClientAccountingSettings(clientId);
  
  const updateClient = useUpdateClient();
  const updateAccountingSettings = useCreateOrUpdateClientAccountingSettings();
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      core_lead_id: null,
      agreement_id: null,
      expiry_date: null,
      join_date: null,
      show_in_task_matrix: false,
      show_in_form_matrix: false,
      enable_geo_fencing: false,
    },
  });

  const accountingForm = useForm<AccountingFormValues>({
    resolver: zodResolver(accountingFormSchema),
    defaultValues: {
      invoice_method: 'per_visit',
      invoice_display_type: 'per_visit',
      billing_address_same_as_personal: true,
      billing_address: null,
      mileage_rule_no_payment: false,
      service_payer: 'authorities',
      authority_category: null,
    },
  });

  const billingAddressSameAsPersonal = accountingForm.watch('billing_address_same_as_personal');
  const servicePayer = accountingForm.watch('service_payer');
  
  // Load data into form when available
  useEffect(() => {
    if (settings) {
      form.reset({
        core_lead_id: settings.core_lead_id,
        agreement_id: settings.agreement_id,
        expiry_date: settings.expiry_date ? new Date(settings.expiry_date) : null,
        join_date: settings.join_date ? new Date(settings.join_date) : null,
        show_in_task_matrix: settings.show_in_task_matrix,
        show_in_form_matrix: settings.show_in_form_matrix,
        enable_geo_fencing: settings.enable_geo_fencing,
      });
    }
  }, [settings, form]);

  // Load accounting settings into form
  useEffect(() => {
    if (accountingSettings) {
      accountingForm.reset({
        invoice_method: (accountingSettings.invoice_method as InvoiceMethod) || 'per_visit',
        invoice_display_type: accountingSettings.invoice_display_type || 'per_visit',
        billing_address_same_as_personal: accountingSettings.billing_address_same_as_personal ?? true,
        billing_address: accountingSettings.billing_address || null,
        mileage_rule_no_payment: accountingSettings.mileage_rule_no_payment || false,
        service_payer: (accountingSettings.service_payer as ServicePayer) || 'authorities',
        authority_category: (accountingSettings.authority_category as AuthorityCategory) || null,
      });
    }
  }, [accountingSettings, accountingForm]);
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      await updateClient.mutateAsync({
        clientId,
        updates: {
          core_lead_id: values.core_lead_id,
          agreement_id: values.agreement_id,
          expiry_date: values.expiry_date ? values.expiry_date.toISOString().split('T')[0] : null,
          registered_on: values.join_date ? values.join_date.toISOString().split('T')[0] : null,
          show_in_task_matrix: values.show_in_task_matrix,
          show_in_form_matrix: values.show_in_form_matrix,
          enable_geo_fencing: values.enable_geo_fencing,
        },
      });
      toast.success("General settings updated successfully");
    } catch (error) {
      toast.error("Failed to update general settings");
      console.error(error);
    }
  };

  const onAccountingSubmit = async (values: AccountingFormValues) => {
    try {
      await updateAccountingSettings.mutateAsync({
        client_id: clientId,
        branch_id: branchId || '',
        organization_id: accountingSettings?.organization_id || '',
        invoice_method: values.invoice_method as InvoiceMethod,
        invoice_display_type: values.invoice_display_type,
        billing_address_same_as_personal: values.billing_address_same_as_personal,
        billing_address: values.billing_address_same_as_personal ? null : values.billing_address,
        mileage_rule_no_payment: values.mileage_rule_no_payment,
        service_payer: values.service_payer as ServicePayer,
        authority_category: values.service_payer === 'authorities' ? values.authority_category : null,
        show_in_task_matrix: accountingSettings?.show_in_task_matrix || false,
        show_in_form_matrix: accountingSettings?.show_in_form_matrix || false,
        enable_geo_fencing: accountingSettings?.enable_geo_fencing || false,
      });
      toast.success('Accounting settings updated successfully');
    } catch (error) {
      toast.error('Failed to update accounting settings');
      console.error(error);
    }
  };
  
  const isLoading = settingsLoading || staffLoading || agreementsLoading;

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general-setting">General Setting</TabsTrigger>
          <TabsTrigger value="general-accounting">General Accounting Settings</TabsTrigger>
          <TabsTrigger value="private-accounting">Private Accounting Setting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general-setting" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Setting
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Core Lead Field */}
                    <FormField
                      control={form.control}
                      name="core_lead_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Core Lead</FormLabel>
                          <Select
                            value={field.value || "none"}
                            onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select core lead" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {staffList.map((staff) => (
                                <SelectItem key={staff.id} value={staff.id}>
                                  {staff.first_name} {staff.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Agreement Field */}
                    <FormField
                      control={form.control}
                      name="agreement_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agreement</FormLabel>
                          <Select
                            value={field.value || "none"}
                            onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select agreement" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {agreements.map((agreement) => (
                                <SelectItem key={agreement.id} value={agreement.id}>
                                  {agreement.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Join Date Field */}
                    <FormField
                      control={form.control}
                      name="join_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Join Date</FormLabel>
                          <EnhancedDatePicker
                            value={field.value || undefined}
                            onChange={(date) => field.onChange(date || null)}
                            placeholder="Select join date"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Expiry Date Field */}
                    <FormField
                      control={form.control}
                      name="expiry_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Expiry Date</FormLabel>
                          <EnhancedDatePicker
                            value={field.value || undefined}
                            onChange={(date) => field.onChange(date || null)}
                            placeholder="Select expiry date"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Show Client In Checkboxes */}
                    <div className="space-y-4">
                      <Label>Show Client In:</Label>
                      
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
                              <FormLabel>Task Matrix</FormLabel>
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
                              <FormLabel>Form Matrix</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Enable Geo Fencing Field */}
                    <FormField
                      control={form.control}
                      name="enable_geo_fencing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Enable Geo Fencing</FormLabel>
                          <Select
                            value={field.value ? "yes" : "no"}
                            onValueChange={(value) => field.onChange(value === "yes")}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="no">No</SelectItem>
                              <SelectItem value="yes">Yes</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit" 
                        disabled={updateClient.isPending || !form.formState.isDirty}
                      >
                        {updateClient.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="general-accounting" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PoundSterling className="h-5 w-5" />
                General Accounting Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accountingLoading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <Form {...accountingForm}>
                  <form onSubmit={accountingForm.handleSubmit(onAccountingSubmit)} className="space-y-6">
                    
                    {/* Invoice Method */}
                    <FormField
                      control={accountingForm.control}
                      name="invoice_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Method</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
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

                    {/* Invoice Display Type */}
                    <FormField
                      control={accountingForm.control}
                      name="invoice_display_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Display Type</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select display type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(invoiceDisplayTypeLabels).map(([value, label]) => (
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

                    {/* Billing Address Same as Personal */}
                    <FormField
                      control={accountingForm.control}
                      name="billing_address_same_as_personal"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Is billing address the same as personal address?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value ? "yes" : "no"}
                              onValueChange={(value) => field.onChange(value === "yes")}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id="billing-yes" />
                                <Label htmlFor="billing-yes" className="font-normal cursor-pointer">
                                  Yes
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="billing-no" />
                                <Label htmlFor="billing-no" className="font-normal cursor-pointer">
                                  No
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Billing Address - Conditional Field */}
                    {!billingAddressSameAsPersonal && (
                      <FormField
                        control={accountingForm.control}
                        name="billing_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Billing Address</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter billing address..."
                                value={field.value || ''}
                                onChange={field.onChange}
                                rows={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}


                    {/* No Mileage Paid to Staff */}
                    <FormField
                      control={accountingForm.control}
                      name="mileage_rule_no_payment"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>No mileage paid to staff when visiting this client</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value ? "yes" : "no"}
                              onValueChange={(value) => field.onChange(value === "yes")}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="mileage-no" />
                                <Label htmlFor="mileage-no" className="font-normal cursor-pointer">
                                  No
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id="mileage-yes" />
                                <Label htmlFor="mileage-yes" className="font-normal cursor-pointer">
                                  Yes
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Who Pays for the Service */}
                    <FormField
                      control={accountingForm.control}
                      name="service_payer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Who pays for the service</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select service payer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(servicePayerLabels).map(([value, label]) => (
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

                    {/* Authority Category - Conditional */}
                    {servicePayer === 'authorities' && (
                      <FormField
                        control={accountingForm.control}
                        name="authority_category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Authority Category</FormLabel>
                            <Select 
                              value={field.value || ''} 
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select authority category" />
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

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit" 
                        disabled={updateAccountingSettings.isPending || !accountingForm.formState.isDirty}
                      >
                        {updateAccountingSettings.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="private-accounting" className="mt-6">
          <PrivateAccountingSettings clientId={clientId} branchId={branchId || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
