import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PoundSterling, CreditCard, Info } from "lucide-react";
import { useStaffGeneralSettings, useUpdateStaffGeneralSettings } from "@/hooks/useStaffGeneralSettings";

const accountingSettingsSchema = z.object({
  contract_type: z.string().nullable(),
  salary_frequency: z.string().nullable(),
});

const bankDetailsSchema = z.object({
  bank_name: z.string().nullable(),
  bank_account_name: z.string().nullable(),
  bank_account_number: z.string().nullable().refine(
    (val) => !val || /^\d{8}$/.test(val.replace(/\s/g, '')),
    { message: 'Account number must be 8 digits' }
  ),
  bank_sort_code: z.string().nullable().refine(
    (val) => !val || /^\d{2}-?\d{2}-?\d{2}$/.test(val.replace(/\s/g, '')),
    { message: 'Sort code must be 6 digits (XX-XX-XX)' }
  ),
});

type AccountingSettingsFormValues = z.infer<typeof accountingSettingsSchema>;
type BankDetailsFormValues = z.infer<typeof bankDetailsSchema>;

interface CarerGeneralTabProps {
  carerId: string;
  branchId?: string;
}

export const CarerGeneralTab: React.FC<CarerGeneralTabProps> = ({ carerId }) => {
  const [activeSubTab, setActiveSubTab] = useState("general-accounting");
  
  const { data: settings, isLoading } = useStaffGeneralSettings(carerId);
  const updateSettings = useUpdateStaffGeneralSettings();

  const accountingForm = useForm<AccountingSettingsFormValues>({
    resolver: zodResolver(accountingSettingsSchema),
    defaultValues: {
      contract_type: null,
      salary_frequency: null,
    },
  });

  const bankForm = useForm<BankDetailsFormValues>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      bank_name: null,
      bank_account_name: null,
      bank_account_number: null,
      bank_sort_code: null,
    },
  });

  useEffect(() => {
    if (settings) {
      accountingForm.reset({
        contract_type: settings.contract_type,
        salary_frequency: settings.salary_frequency,
      });

      bankForm.reset({
        bank_name: settings.bank_name,
        bank_account_name: settings.bank_account_name,
        bank_account_number: settings.bank_account_number,
        bank_sort_code: settings.bank_sort_code,
      });
    }
  }, [settings, accountingForm, bankForm]);

  const onAccountingSubmit = async (values: AccountingSettingsFormValues) => {
    await updateSettings.mutateAsync({
      staffId: carerId,
      updates: values,
    });
  };

  const onBankSubmit = async (values: BankDetailsFormValues) => {
    // Format sort code with dashes if not already formatted
    const formattedSortCode = values.bank_sort_code
      ? values.bank_sort_code.replace(/\s/g, '').replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3')
      : null;
    
    await updateSettings.mutateAsync({
      staffId: carerId,
      updates: {
        ...values,
        bank_sort_code: formattedSortCode,
      },
    });
  };

  const formatSortCode = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general-accounting">Accounting Settings</TabsTrigger>
          <TabsTrigger value="bank-details">Bank Details</TabsTrigger>
        </TabsList>

        <TabsContent value="general-accounting" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PoundSterling className="h-5 w-5" />
                Accounting Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <Form {...accountingForm}>
                    <form onSubmit={accountingForm.handleSubmit(onAccountingSubmit)} className="space-y-6">
                      <FormField
                        control={accountingForm.control}
                        name="contract_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contract Type</FormLabel>
                            <Select
                              value={field.value || "none"}
                              onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select contract type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Not Specified</SelectItem>
                                <SelectItem value="full_time">Full-time</SelectItem>
                                <SelectItem value="part_time">Part-time</SelectItem>
                                <SelectItem value="zero_hours">Zero-hours</SelectItem>
                                <SelectItem value="agency">Agency</SelectItem>
                                <SelectItem value="contractor">Contractor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={accountingForm.control}
                        name="salary_frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pay Frequency</FormLabel>
                            <Select
                              value={field.value || "none"}
                              onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Not Specified</SelectItem>
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="bi_weekly">Bi-weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="per_visit">Per Visit</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
                        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          Staff pay rates and travel payment preferences are managed in the <strong>Rate</strong> tab via Rate Schedules.
                        </p>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button 
                          type="submit" 
                          disabled={updateSettings.isPending || !accountingForm.formState.isDirty}
                        >
                          {updateSettings.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank-details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <Form {...bankForm}>
                  <form onSubmit={bankForm.handleSubmit(onBankSubmit)} className="space-y-6">
                    <FormField
                      control={bankForm.control}
                      name="bank_account_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. John Smith"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bankForm.control}
                      name="bank_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Barclays, HSBC, Lloyds"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={bankForm.control}
                        name="bank_account_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="12345678"
                                maxLength={8}
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={bankForm.control}
                        name="bank_sort_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sort Code</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="XX-XX-XX"
                                maxLength={8}
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  const formatted = formatSortCode(e.target.value);
                                  field.onChange(formatted);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Bank details are stored securely and used during payroll processing.
                      </p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit" 
                        disabled={updateSettings.isPending || !bankForm.formState.isDirty}
                      >
                        {updateSettings.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};