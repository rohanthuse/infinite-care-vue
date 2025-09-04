
import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Stethoscope, Activity } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WizardStep4MedicalInfoProps {
  form: UseFormReturn<any>;
}

const PHYSICAL_HEALTH_CONDITIONS = [
  "Cancer", "Arthritis", "Heart Condition", "Diabetes", "Chronic Pain", 
  "Chronic Respiratory", "Addiction", "Other Medical Conditions", 
  "Blood Pressure", "Thyroid", "Multiple Sclerosis", "Parkinson's", 
  "Bilateral Periventricular Leukomalacia", "Quadriplegic", "Cerebral Palsy", 
  "Non", "Epilepsy"
];

const MENTAL_HEALTH_CONDITIONS = [
  "Dementia", "Insomnia", "Alzheimer's Disease", "Hoarding Disorder", 
  "Self-harm", "Phobia", "Panic Disorder", "Stress Disorder", "Schizophrenia", 
  "Obsessive Compulsive Disorder", "Autism", "Other Mental Conditions", 
  "Chronic Neurological", "Depression", "Non"
];

export function WizardStep4MedicalInfo({ form }: WizardStep4MedicalInfoProps) {
  const [activeSubTab, setActiveSubTab] = useState("medical");
  const addMedicalCondition = () => {
    const current = form.getValues("medical_info.medical_conditions") || [];
    form.setValue("medical_info.medical_conditions", [...current, ""]);
  };

  const removeMedicalCondition = (index: number) => {
    const current = form.getValues("medical_info.medical_conditions") || [];
    form.setValue("medical_info.medical_conditions", current.filter((_, i) => i !== index));
  };

  const addMedication = () => {
    const current = form.getValues("medical_info.current_medications") || [];
    form.setValue("medical_info.current_medications", [...current, ""]);
  };

  const removeMedication = (index: number) => {
    const current = form.getValues("medical_info.current_medications") || [];
    form.setValue("medical_info.current_medications", current.filter((_, i) => i !== index));
  };

  const addAllergy = () => {
    const current = form.getValues("medical_info.allergies") || [];
    form.setValue("medical_info.allergies", [...current, ""]);
  };

  const removeAllergy = (index: number) => {
    const current = form.getValues("medical_info.allergies") || [];
    form.setValue("medical_info.allergies", current.filter((_, i) => i !== index));
  };

  const addSensoryImpairment = () => {
    const current = form.getValues("medical_info.sensory_impairments") || [];
    form.setValue("medical_info.sensory_impairments", [...current, ""]);
  };

  const removeSensoryImpairment = (index: number) => {
    const current = form.getValues("medical_info.sensory_impairments") || [];
    form.setValue("medical_info.sensory_impairments", current.filter((_, i) => i !== index));
  };

  const medicalConditions = form.watch("medical_info.medical_conditions") || [];
  const medications = form.watch("medical_info.current_medications") || [];
  const allergies = form.watch("medical_info.allergies") || [];
  const sensoryImpairments = form.watch("medical_info.sensory_impairments") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Medical and Mental</h2>
        <p className="text-gray-600">
          Complete medical history, conditions, medications, and health status.
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="medical" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Medical and Mental
          </TabsTrigger>
          <TabsTrigger value="serviceband" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Service Band
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medical" className="space-y-6">
          <Form {...form}>
            <div className="space-y-8">
              {/* Medical Conditions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-medium">Medical Conditions</FormLabel>
                  <Button type="button" onClick={addMedicalCondition} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Condition
                  </Button>
                </div>
                {medicalConditions.map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`medical_info.medical_conditions.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Enter medical condition" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      onClick={() => removeMedicalCondition(index)}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Current Medications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-medium">Current Medications</FormLabel>
                  <Button type="button" onClick={addMedication} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Medication
                  </Button>
                </div>
                {medications.map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`medical_info.current_medications.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Enter medication name and dosage" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      onClick={() => removeMedication(index)}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Allergies */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-medium">Allergies</FormLabel>
                  <Button type="button" onClick={addAllergy} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Allergy
                  </Button>
                </div>
                {allergies.map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`medical_info.allergies.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Enter allergy" {...field} />
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

              {/* Medical History */}
              <FormField
                control={form.control}
                name="medical_info.medical_history"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical History</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe relevant medical history..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mobility Status */}
                <FormField
                  control={form.control}
                  name="medical_info.mobility_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobility Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mobility status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="independent">Independent</SelectItem>
                          <SelectItem value="assistance_required">Assistance Required</SelectItem>
                          <SelectItem value="wheelchair_bound">Wheelchair Bound</SelectItem>
                          <SelectItem value="bed_bound">Bed Bound</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cognitive Status */}
                <FormField
                  control={form.control}
                  name="medical_info.cognitive_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cognitive Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cognitive status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="mild_impairment">Mild Impairment</SelectItem>
                          <SelectItem value="moderate_impairment">Moderate Impairment</SelectItem>
                          <SelectItem value="severe_impairment">Severe Impairment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Communication Needs */}
              <FormField
                control={form.control}
                name="medical_info.communication_needs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Needs</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe any special communication requirements..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sensory Impairments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-medium">Sensory Impairments</FormLabel>
                  <Button type="button" onClick={addSensoryImpairment} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Impairment
                  </Button>
                </div>
                {sensoryImpairments.map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`medical_info.sensory_impairments.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Enter sensory impairment" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      onClick={() => removeSensoryImpairment(index)}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Mental Health Status */}
              <FormField
                control={form.control}
                name="medical_info.mental_health_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mental Health Status</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe mental health status and any relevant conditions..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Physical and Mental Health Conditions Checkboxes */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Physical Health Conditions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Medical Physical Health Conditions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FormField
                      control={form.control}
                      name="medical_info.physical_health_conditions"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid gap-2 max-h-64 overflow-y-auto">
                            {PHYSICAL_HEALTH_CONDITIONS.map((condition) => (
                              <div key={condition} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`physical-${condition}`}
                                  checked={field.value?.includes(condition) || false}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, condition]);
                                    } else {
                                      field.onChange(currentValue.filter((item: string) => item !== condition));
                                    }
                                  }}
                                />
                                <Label 
                                  htmlFor={`physical-${condition}`} 
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {condition}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Mental Health Conditions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Mental Health Conditions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FormField
                      control={form.control}
                      name="medical_info.mental_health_conditions"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid gap-2 max-h-64 overflow-y-auto">
                            {MENTAL_HEALTH_CONDITIONS.map((condition) => (
                              <div key={condition} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`mental-${condition}`}
                                  checked={field.value?.includes(condition) || false}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, condition]);
                                    } else {
                                      field.onChange(currentValue.filter((item: string) => item !== condition));
                                    }
                                  }}
                                />
                                <Label 
                                  htmlFor={`mental-${condition}`} 
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {condition}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </Form>
        </TabsContent>

        <TabsContent value="serviceband" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Band Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Service band information will be configured here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
