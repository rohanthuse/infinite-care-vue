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
import { PoundSterling, CreditCard } from "lucide-react";
import { useStaffGeneralSettings, useUpdateStaffGeneralSettings } from "@/hooks/useStaffGeneralSettings";
import { StaffTravelPaymentSelector } from "@/components/staff/StaffTravelPaymentSelector";

const accountingSettingsSchema = z.object({
  contract_type: z.string().nullable(),
  salary_amount: z.number().nullable(),
  salary_frequency: z.string().nullable(),
});

const bankDetailsSchema = z.object({
  bank_name: z.string().nullable(),
  bank_account_holder: z.string().nullable(),
  bank_account_number: z.string().nullable(),
  bank_sort_code: z.string().nullable(),
});

type AccountingSettingsFormValues = z.infer<typeof accountingSettingsSchema>;
type BankDetailsFormValues = z.infer<typeof bankDetailsSchema>;

interface CarerGeneralTabProps {
  carerId: string;
  branchId?: string;
}

export const CarerGeneralTab: React.FC<CarerGeneralTabProps> = ({ carerId, branchId }) => {
  const [activeSubTab, setActiveSubTab] = useState("general-accounting");
  
  const { data: settings, isLoading } = useStaffGeneralSettings(carerId);
  const updateSettings = useUpdateStaffGeneralSettings();

  const accountingForm = useForm<AccountingSettingsFormValues>({
    resolver: zodResolver(accountingSettingsSchema),
    defaultValues: {
      contract_type: null,
      salary_amount: null,
      salary_frequency: null,
    },
  });

  const bankForm = useForm<BankDetailsFormValues>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      bank_name: null,
      bank_account_holder: null,
      bank_account_number: null,
      bank_sort_code: null,
    },
  });

  useEffect(() => {
    if (settings) {
      accountingForm.reset({
        contract_type: settings.contract_type,
        salary_amount: settings.salary_amount,
        salary_frequency: settings.salary_frequency,
      });

      bankForm.reset({
        bank_name: settings.bank_name,
        bank_account_holder: settings.bank_account_holder,
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
    await updateSettings.mutateAsync({
      staffId: carerId,
      updates: values,
    });
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

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={accountingForm.control}
                          name="salary_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pay Amount (£)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                />
                              </FormControl>
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

                  <div className="border-t pt-6">
                    <StaffTravelPaymentSelector staffId={carerId} />
                  </div>
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

                    <FormField
                      control={bankForm.control}
                      name="bank_account_holder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Name as it appears on the account"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={bankForm.control}
                        name="bank_account_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="8 digit account number"
                                maxLength={8}
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
                        name="bank_sort_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sort Code</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="00-00-00"
                                maxLength={8}
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
