import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WizardStepConsentProps {
  form: UseFormReturn<any>;
}

export function WizardStepConsent({ form }: WizardStepConsentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consent & Capacity Assessment</CardTitle>
        <CardDescription>
          Document consent status and capacity assessment details for care plan approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="having-capacity" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="having-capacity">Having Capacity</TabsTrigger>
            <TabsTrigger value="lacking-capacity">Lacking Capacity</TabsTrigger>
            <TabsTrigger value="third-party">Third Party Consent</TabsTrigger>
          </TabsList>
          
          <TabsContent value="having-capacity" className="space-y-4 mt-6">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="consent.has_capacity"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Client has capacity to consent</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Client has the mental capacity to make decisions about their care
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consent.capacity_assessment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity Assessment Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="Select assessment date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consent.capacity_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter details about the capacity assessment, decision-making process, and any relevant observations..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="lacking-capacity" className="space-y-4 mt-6">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="consent.lacks_capacity"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Client lacks capacity to consent</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Client does not have the mental capacity to make decisions about their care
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consent.capacity_loss_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Lack of Capacity</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain the reason why the client lacks capacity (e.g., dementia, mental health condition, temporary impairment)..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consent.best_interest_decision"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Best interest decision made</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        A best interest decision has been made for the client's care
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consent.best_interest_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Best Interest Decision Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="Select decision date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consent.best_interest_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Best Interest Decision Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Document the best interest decision-making process, who was involved, and the rationale for the decision..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="third-party" className="space-y-4 mt-6">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="consent.third_party_consent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Third party consent obtained</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Consent has been obtained from an authorized third party
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="consent.third_party_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Third Party Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter full name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.third_party_relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship to Client</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Power of Attorney, Family Member"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="consent.third_party_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Third Party Contact Information</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Phone number, email, or address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consent.third_party_consent_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consent Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="Select consent date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consent.third_party_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Document any additional information about the third party consent process, authorization documents, or special circumstances..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}