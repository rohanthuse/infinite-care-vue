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
import { EnhancedSignatureCanvas } from "@/components/agreements/EnhancedSignatureCanvas";
import { FileUploadDropzone } from "@/components/agreements/FileUploadDropzone";
import { useFileUpload } from "@/hooks/useFileUpload";

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
            <TabsTrigger value="having-capacity" className="consent-tab-button">Having Capacity</TabsTrigger>
            <TabsTrigger value="lacking-capacity" className="consent-tab-button">Lacking Capacity</TabsTrigger>
            <TabsTrigger value="third-party" className="consent-tab-button">Third Party Consent</TabsTrigger>
          </TabsList>
          
          <TabsContent value="having-capacity" className="space-y-4 mt-6">
            <div className="max-h-[55vh] overflow-y-auto pr-2">
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

              <div className="border-t pt-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Consent Statements</h3>
                  <p className="text-sm text-muted-foreground">Please confirm your consent to the following aspects of care and support:</p>
                  
                  <FormField
                    control={form.control}
                    name="consent.consent_to_care_and_support"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          I consent to receiving care and support as outlined in my care plan <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="care-support-yes" />
                              <Label htmlFor="care-support-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="care-support-no" />
                              <Label htmlFor="care-support-no">No</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consent.consent_to_personal_care"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          I consent to receiving personal care assistance as detailed in my care plan <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="personal-care-yes" />
                              <Label htmlFor="personal-care-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="personal-care-no" />
                              <Label htmlFor="personal-care-no">No</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consent.consent_to_medication_administration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          I consent to medication administration and support as specified in my care plan <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="medication-admin-yes" />
                              <Label htmlFor="medication-admin-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="medication-admin-no" />
                              <Label htmlFor="medication-admin-no">No</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consent.consent_to_healthcare_professionals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          I consent to liaising with healthcare professionals on my behalf <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="healthcare-prof-yes" />
                              <Label htmlFor="healthcare-prof-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="healthcare-prof-no" />
                              <Label htmlFor="healthcare-prof-no">No</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consent.consent_to_emergency_services"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          I consent to contacting emergency services if necessary <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="emergency-services-yes" />
                              <Label htmlFor="emergency-services-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="emergency-services-no" />
                              <Label htmlFor="emergency-services-no">No</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consent.consent_to_data_sharing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          I consent to sharing my personal data as outlined in the privacy policy <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="data-sharing-yes" />
                              <Label htmlFor="data-sharing-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="data-sharing-no" />
                              <Label htmlFor="data-sharing-no">No</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consent.consent_to_care_plan_changes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          I consent to reasonable adjustments to my care plan as needed <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="care-changes-yes" />
                              <Label htmlFor="care-changes-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="care-changes-no" />
                              <Label htmlFor="care-changes-no">No</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="consent.extra_information"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Extra Information</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide any additional information or specific requirements regarding your consent and care preferences..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.typed_full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Type your full name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full legal name"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            // Update confirmed_by when typing full name
                            form.setValue("consent.confirmed_by", e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel>
                    Signature <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormField
                    control={form.control}
                    name="consent.signature_data"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <EnhancedSignatureCanvas
                            onSignatureSave={(signature) => {
                              field.onChange(signature);
                              // Set confirmation timestamp when signature is saved
                              form.setValue("consent.confirmed_on", new Date().toISOString());
                            }}
                            initialSignature={field.value}
                            disabled={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Confirmation Section - Read Only */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="text-lg font-medium">Confirmation</h4>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Confirmed by:</span>
                        <p className="mt-1">{form.watch("consent.confirmed_by") || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Confirmed on:</span>
                        <p className="mt-1">
                          {form.watch("consent.confirmed_on") 
                            ? new Date(form.watch("consent.confirmed_on")).toLocaleString()
                            : "Not confirmed"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
            </div>
          </TabsContent>

          <TabsContent value="lacking-capacity" className="space-y-4 mt-6">
            <div className="max-h-[55vh] overflow-y-auto pr-2">
              <div className="grid gap-4">
              <Alert>
                <AlertDescription>
                  This section is to be completed when the person lacks capacity to consent to their care and support plan. The assessment should be conducted in accordance with the Mental Capacity Act 2005.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <h3 className="text-lg font-medium">Assessor Statements</h3>
                <p className="text-sm text-muted-foreground">Please complete the following assessments:</p>

                <FormField
                  control={form.control}
                  name="consent.assessor_statement_1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        I have assessed that the person lacks capacity to make this decision <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="statement1-yes" />
                            <Label htmlFor="statement1-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="statement1-no" />
                            <Label htmlFor="statement1-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.assessor_statement_2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        I have considered all relevant information available to make this assessment <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="statement2-yes" />
                            <Label htmlFor="statement2-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="statement2-no" />
                            <Label htmlFor="statement2-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.assessor_statement_3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        I have involved the person as much as possible in the decision-making process <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="statement3-yes" />
                            <Label htmlFor="statement3-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="statement3-no" />
                            <Label htmlFor="statement3-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.assessor_statement_4"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        I have considered the person's past and present wishes and feelings <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="statement4-yes" />
                            <Label htmlFor="statement4-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="statement4-no" />
                            <Label htmlFor="statement4-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.assessor_statement_5"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        I have considered the beliefs and values that would be likely to influence the person's decision <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="statement5-yes" />
                            <Label htmlFor="statement5-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="statement5-no" />
                            <Label htmlFor="statement5-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.assessor_statement_6"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        I have consulted others whom it is appropriate to consult <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="statement6-yes" />
                            <Label htmlFor="statement6-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="statement6-no" />
                            <Label htmlFor="statement6-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.assessor_statement_7"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        I believe this decision is in the person's best interests <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="statement7-yes" />
                            <Label htmlFor="statement7-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="statement7-no" />
                            <Label htmlFor="statement7-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.assessor_statement_8"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        I understand my responsibilities under the Mental Capacity Act 2005 <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="statement8-yes" />
                            <Label htmlFor="statement8-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="statement8-no" />
                            <Label htmlFor="statement8-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.assessor_statement_9"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        I am satisfied that this care plan represents the least restrictive option <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="statement9-yes" />
                            <Label htmlFor="statement9-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="statement9-no" />
                            <Label htmlFor="statement9-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-6 space-y-6">
                <div className="space-y-4">
                  <FormLabel className="text-lg font-medium">
                    Best Interest Decision File
                  </FormLabel>
                  <FormField
                    control={form.control}
                    name="consent.best_interest_decision_files"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FileUploadDropzone
                            onFilesSelected={(files) => {
                              const currentFiles = field.value || [];
                              const newFileNames = files.map(file => file.name);
                              field.onChange([...currentFiles, ...newFileNames]);
                            }}
                            maxFiles={5}
                            acceptedFileTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']}
                            category="document"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="consent.lacking_capacity_extra_information"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Extra Information
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide any additional information relevant to this capacity assessment and best interest decision..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent.assessor_full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Full name of the Assessor <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter the full legal name of the assessor"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel>
                    Assessor Signature <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormField
                    control={form.control}
                    name="consent.assessor_signature_data"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <EnhancedSignatureCanvas
                            onSignatureSave={(signature) => {
                              field.onChange(signature);
                              // Set confirmation timestamp when signature is saved
                              form.setValue("consent.assessor_confirmed_on", new Date().toISOString());
                            }}
                            initialSignature={field.value}
                            disabled={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Confirmation Section - Read Only */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="text-lg font-medium">Confirmation</h4>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Assessed by:</span>
                        <p className="mt-1">{form.watch("consent.assessor_full_name") || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Assessed on:</span>
                        <p className="mt-1">
                          {form.watch("consent.assessor_confirmed_on") 
                            ? new Date(form.watch("consent.assessor_confirmed_on")).toLocaleString()
                            : "Not confirmed"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="third-party" className="space-y-4 mt-6">
            <div className="max-h-[55vh] overflow-y-auto pr-2">
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
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}