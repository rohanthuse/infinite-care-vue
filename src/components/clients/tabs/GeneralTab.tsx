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

const formSchema = z.object({
  core_lead_id: z.string().nullable(),
  agreement_id: z.string().nullable(),
  expiry_date: z.date().nullable(),
  show_in_task_matrix: z.boolean(),
  show_in_form_matrix: z.boolean(),
  enable_geo_fencing: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

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
  
  const updateClient = useUpdateClient();
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      core_lead_id: null,
      agreement_id: null,
      expiry_date: null,
      show_in_task_matrix: false,
      show_in_form_matrix: false,
      enable_geo_fencing: false,
    },
  });
  
  // Load data into form when available
  useEffect(() => {
    if (settings) {
      form.reset({
        core_lead_id: settings.core_lead_id,
        agreement_id: settings.agreement_id,
        expiry_date: settings.expiry_date ? new Date(settings.expiry_date) : null,
        show_in_task_matrix: settings.show_in_task_matrix,
        show_in_form_matrix: settings.show_in_form_matrix,
        enable_geo_fencing: settings.enable_geo_fencing,
      });
    }
  }, [settings, form]);
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      await updateClient.mutateAsync({
        clientId,
        updates: {
          core_lead_id: values.core_lead_id,
          agreement_id: values.agreement_id,
          expiry_date: values.expiry_date ? values.expiry_date.toISOString().split('T')[0] : null,
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
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  General accounting settings will be added here...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="private-accounting" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Private Accounting Setting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Private accounting settings will be added here...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
