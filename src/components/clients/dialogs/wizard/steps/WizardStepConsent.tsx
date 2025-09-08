import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
              <Alert>
                <AlertDescription>
                  The purpose of this care plan is to ensure that care and support is provided in line with your assessed needs, preferences and choices. We are committed to working with you to achieve your desired outcomes in a way that promotes your dignity and respects your human rights.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="consent.discuss_health_and_risks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Can we discuss your health needs and associated risks with you? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="discuss-yes" />
                            <Label htmlFor="discuss-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="discuss-no" />
                            <Label htmlFor="discuss-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.medication_support_consent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Do you consent to receiving medication support as detailed in your care and support plan? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="medication-yes" />
                            <Label htmlFor="medication-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="medication-no" />
                            <Label htmlFor="medication-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.care_plan_importance_understood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Do you understand the importance of following your care and support plan? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="importance-yes" />
                            <Label htmlFor="importance-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="importance-no" />
                            <Label htmlFor="importance-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.share_info_with_professionals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Do you consent to us sharing information about you with other relevant professionals as required? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="share-yes" />
                            <Label htmlFor="share-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="share-no" />
                            <Label htmlFor="share-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.regular_reviews_understood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Do you understand that your care and support plan will be reviewed on a regular basis? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="reviews-yes" />
                            <Label htmlFor="reviews-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="reviews-no" />
                            <Label htmlFor="reviews-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.may_need_capacity_assessment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Do you understand that you may need a capacity assessment if there are concerns about your ability to make decisions? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="assessment-yes" />
                            <Label htmlFor="assessment-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="assessment-no" />
                            <Label htmlFor="assessment-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-6 space-y-4">
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