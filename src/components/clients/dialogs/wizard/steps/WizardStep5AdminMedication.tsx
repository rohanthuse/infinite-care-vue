import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Upload, FileText, Clock, Calendar, Package } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WizardStep5AdminMedicationProps {
  form: UseFormReturn<any>;
}

export function WizardStep5AdminMedication({ form }: WizardStep5AdminMedicationProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Helper functions for array management
  const addAllergy = () => {
    const current = form.getValues("medical_info.admin_medication.allergies") || [];
    form.setValue("medical_info.admin_medication.allergies", [...current, ""]);
  };

  const removeAllergy = (index: number) => {
    const current = form.getValues("medical_info.admin_medication.allergies") || [];
    form.setValue("medical_info.admin_medication.allergies", current.filter((_, i) => i !== index));
  };

  const addPrnProtocol = () => {
    const current = form.getValues("medical_info.admin_medication.prn_protocols") || [];
    form.setValue("medical_info.admin_medication.prn_protocols", [
      ...current,
      { medication: "", condition: "", max_dose: "", frequency: "", notes: "" }
    ]);
  };

  const removePrnProtocol = (index: number) => {
    const current = form.getValues("medical_info.admin_medication.prn_protocols") || [];
    form.setValue("medical_info.admin_medication.prn_protocols", current.filter((_, i) => i !== index));
  };

  const addAttachment = () => {
    const current = form.getValues("medical_info.admin_medication.attachments") || [];
    form.setValue("medical_info.admin_medication.attachments", [
      ...current,
      { name: "", type: "prescription", notes: "" }
    ]);
  };

  const removeAttachment = (index: number) => {
    const current = form.getValues("medical_info.admin_medication.attachments") || [];
    form.setValue("medical_info.admin_medication.attachments", current.filter((_, i) => i !== index));
  };

  // Watch arrays for dynamic rendering
  const allergies = form.watch("medical_info.admin_medication.allergies") || [];
  const prnProtocols = form.watch("medical_info.admin_medication.prn_protocols") || [];
  const attachments = form.watch("medical_info.admin_medication.attachments") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Admin Medication</h2>
        <p className="text-gray-600">
          Medication administration details, allergies, protocols, and pharmacy information.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assistance">Assistance</TabsTrigger>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Form {...form}>
            <div className="space-y-6">
              {/* Does Client Use Medication */}
              <FormField
                control={form.control}
                name="medical_info.admin_medication.uses_medication"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Does the service user use medication?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="uses_med_yes" />
                          <Label htmlFor="uses_med_yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="uses_med_no" />
                          <Label htmlFor="uses_med_no">No</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="others" id="uses_med_others" />
                          <Label htmlFor="uses_med_others">Others</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Has Medicines Box */}
              <FormField
                control={form.control}
                name="medical_info.admin_medication.has_medicines_box"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Does the service user have a medicines box?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="box_yes" />
                          <Label htmlFor="box_yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="box_no" />
                          <Label htmlFor="box_no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Access to Medicines */}
              <FormField
                control={form.control}
                name="medical_info.admin_medication.access_to_medicines"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Does the service user have access to their own medicines?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="access_yes" />
                          <Label htmlFor="access_yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="access_no" />
                          <Label htmlFor="access_no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Use Dosette Box */}
              <FormField
                control={form.control}
                name="medical_info.admin_medication.use_dosette_box"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Does the service user use a dosette box?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="dosette_yes" />
                          <Label htmlFor="dosette_yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="dosette_no" />
                          <Label htmlFor="dosette_no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Allergies */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-medium">Known Allergies</FormLabel>
                  <Button type="button" onClick={addAllergy} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Allergy
                  </Button>
                </div>
                {allergies.map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`medical_info.admin_medication.allergies.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Enter allergy or reaction" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      onClick={() => removeAllergy(index)}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Pharmacy Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Pharmacy & GP Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="medical_info.admin_medication.pharmacy_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pharmacy Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter pharmacy name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medical_info.admin_medication.pharmacy_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pharmacy Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter pharmacy phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="medical_info.admin_medication.pharmacy_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pharmacy Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter pharmacy address"
                            className="min-h-[60px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="medical_info.admin_medication.gp_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GP Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter GP name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medical_info.admin_medication.gp_practice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GP Practice</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter GP practice" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </Form>
        </TabsContent>

        <TabsContent value="assistance" className="space-y-6">
          <Form {...form}>
            <div className="space-y-6">
              {/* Level of Assistance */}
              <FormField
                control={form.control}
                name="medical_info.admin_medication.assistance_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What assistance is required?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="full_administration" id="assist_full" />
                          <Label htmlFor="assist_full">Full administration by carer</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="prompting_supervision" id="assist_prompt" />
                          <Label htmlFor="assist_prompt">Prompting and supervision</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="independent" id="assist_independent" />
                          <Label htmlFor="assist_independent">Service user is independent</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="others" id="assist_others" />
                          <Label htmlFor="assist_others">Others</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Help with Inhalers */}
              <FormField
                control={form.control}
                name="medical_info.admin_medication.help_inhalers"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Does the service user need help with inhalers?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="inhaler_help_yes" />
                          <Label htmlFor="inhaler_help_yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="inhaler_help_no" />
                          <Label htmlFor="inhaler_help_no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Administration & Handling Methods */}
              <div className="space-y-3">
                <FormLabel>Administration & Handling methods</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    "Oral",
                    "Topical", 
                    "Injection",
                    "Eye Drops",
                    "Ear Drops", 
                    "Suppository",
                    "Inhaler",
                    "Other"
                  ].map((method) => (
                    <FormField
                      key={method}
                      control={form.control}
                      name="medical_info.admin_medication.administration_methods"
                      render={({ field }) => {
                        const currentMethods = field.value || [];
                        return (
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`admin_method_${method.toLowerCase().replace(' ', '_')}`}
                              checked={currentMethods.includes(method)}
                              onChange={(e) => {
                                const updatedMethods = e.target.checked 
                                  ? [...currentMethods, method]
                                  : currentMethods.filter((m: string) => m !== method);
                                field.onChange(updatedMethods);
                              }}
                            />
                            <Label htmlFor={`admin_method_${method.toLowerCase().replace(' ', '_')}`}>{method}</Label>
                          </div>
                        );
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Prescribed By */}
              <FormField
                control={form.control}
                name="medical_info.admin_medication.prescribed_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prescribed by</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter prescribing doctor or healthcare provider" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Repeat Prescription Frequency */}
              <FormField
                control={form.control}
                name="medical_info.admin_medication.repeat_frequency"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>How often are repeat prescriptions required?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="weekly" id="repeat_weekly" />
                          <Label htmlFor="repeat_weekly">Weekly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fortnightly" id="repeat_fortnightly" />
                          <Label htmlFor="repeat_fortnightly">Fortnightly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="monthly" id="repeat_monthly" />
                          <Label htmlFor="repeat_monthly">Monthly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="others" id="repeat_others" />
                          <Label htmlFor="repeat_others">Others</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Special Requirements */}
              <FormField
                control={form.control}
                name="medical_info.admin_medication.special_requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Requirements or Considerations</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special requirements, timing, food restrictions, etc."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </TabsContent>

        <TabsContent value="protocols" className="space-y-6">
          <Form {...form}>
            <div className="space-y-6">
              {/* PRN Protocols */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <FormLabel className="text-base font-medium">PRN (As Needed) Protocols</FormLabel>
                    <p className="text-sm text-gray-600 mt-1">
                      Medications to be given only when specific conditions are met
                    </p>
                  </div>
                  <Button type="button" onClick={addPrnProtocol} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add PRN Protocol
                  </Button>
                </div>
                
                {prnProtocols.map((_, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">PRN Protocol #{index + 1}</CardTitle>
                        <Button
                          type="button"
                          onClick={() => removePrnProtocol(index)}
                          size="sm"
                          variant="outline"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`medical_info.admin_medication.prn_protocols.${index}.medication`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Medication Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter medication name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`medical_info.admin_medication.prn_protocols.${index}.condition`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>When to Give</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Pain level 5+, Anxiety attack" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`medical_info.admin_medication.prn_protocols.${index}.max_dose`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maximum Dose</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 2 tablets, 5ml" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`medical_info.admin_medication.prn_protocols.${index}.frequency`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maximum Frequency</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Every 4 hours, Once daily" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`medical_info.admin_medication.prn_protocols.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Special instructions, precautions, or monitoring requirements"
                                className="min-h-[60px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Form>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <FormLabel className="text-base font-medium">Medication-Related Documents</FormLabel>
                <p className="text-sm text-gray-600 mt-1">
                  Upload prescriptions, MAR sheets, medication protocols, etc.
                </p>
              </div>
              <Button type="button" onClick={addAttachment} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Document
              </Button>
            </div>
            
            {attachments.map((_, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`medical_info.admin_medication.attachments.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Document Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Current Prescription List" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`medical_info.admin_medication.attachments.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Document Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select document type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="prescription">Prescription</SelectItem>
                                  <SelectItem value="mar_sheet">MAR Sheet</SelectItem>
                                  <SelectItem value="protocol">Medication Protocol</SelectItem>
                                  <SelectItem value="allergy_list">Allergy Information</SelectItem>
                                  <SelectItem value="gp_letter">GP Letter</SelectItem>
                                  <SelectItem value="pharmacy_info">Pharmacy Information</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`medical_info.admin_medication.attachments.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description/Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief description of the document"
                                className="min-h-[60px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {attachments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No documents added yet</p>
                <p className="text-sm">Click "Add Document" to attach medication-related files</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}