import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Stethoscope, Activity, Eye, Ear, Accessibility, MessageSquare, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { YesNoToggle } from "@/components/care/forms/YesNoToggle";

interface WizardStepDiagnosisProps {
  form: UseFormReturn<any>;
  effectiveCarePlanId?: string;
}

const MEDICAL_CONDITIONS_LIST = [
  "Cancer", "Arthritis", "Heart Condition", "Diabetes", "Chronic Pain", 
  "Chronic Respiratory", "Addiction", "Blood Pressure", "Thyroid", 
  "Multiple Sclerosis", "Parkinson's", "Cerebral Palsy", "Epilepsy",
  "Dementia", "Alzheimer's Disease", "Depression", "Anxiety", "Schizophrenia",
  "Autism", "ADHD", "Bipolar Disorder", "Stroke", "COPD", "Asthma",
  "Kidney Disease", "Liver Disease", "HIV/AIDS", "Osteoporosis"
];

const SERVICE_BAND_CATEGORIES = [
  "Dementia", "Sensory Impairment", "Learning Disability", 
  "Physical Disability/Condition", "People with an Eating Disorder", 
  "Autistic Disorder", "Neurological", "Learning Difficulty", 
  "Mental Health", "Substance Misuse", "Older Adults"
];

export function WizardStepDiagnosis({ form, effectiveCarePlanId }: WizardStepDiagnosisProps) {
  const [activeSubTab, setActiveSubTab] = useState("diagnosis");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [customDiagnosisInput, setCustomDiagnosisInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Toggle medical condition selection
  const toggleMedicalCondition = (condition: string, checked: boolean) => {
    const current = form.getValues("diagnosis.medical_conditions") || [];
    if (checked) {
      form.setValue("diagnosis.medical_conditions", [...current, condition]);
    } else {
      form.setValue("diagnosis.medical_conditions", current.filter((c: string) => c !== condition));
    }
  };

  const selectedConditions = form.watch("diagnosis.medical_conditions") || [];
  const customDiagnoses = form.watch("diagnosis.custom_diagnoses") || [];

  // Add custom diagnosis
  const addCustomDiagnosis = () => {
    if (customDiagnosisInput.trim()) {
      const current = form.getValues("diagnosis.custom_diagnoses") || [];
      if (!current.includes(customDiagnosisInput.trim())) {
        form.setValue("diagnosis.custom_diagnoses", [...current, customDiagnosisInput.trim()]);
      }
      setCustomDiagnosisInput("");
    }
  };

  // Remove custom diagnosis
  const removeCustomDiagnosis = (diagnosis: string) => {
    const current = form.getValues("diagnosis.custom_diagnoses") || [];
    form.setValue("diagnosis.custom_diagnoses", current.filter((d: string) => d !== diagnosis));
  };

  // Handle Enter key for adding custom diagnosis
  const handleCustomDiagnosisKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomDiagnosis();
    }
  };

  // Service Band helper functions
  const toggleServiceBandCategory = (category: string, checked: boolean) => {
    const currentCategories = form.getValues("medical_info.service_band.categories") || [];
    if (checked) {
      form.setValue("medical_info.service_band.categories", [...currentCategories, category]);
      setExpandedCategories(prev => new Set([...prev, category]));
    } else {
      form.setValue("medical_info.service_band.categories", currentCategories.filter((cat: string) => cat !== category));
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(category);
        return newSet;
      });
    }
  };

  const serviceBandCategories = form.watch("medical_info.service_band.categories") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Diagnosis</h2>
        <p className="text-gray-600">
          Record impairments, medical conditions, and service band information.
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="diagnosis" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Diagnosis
          </TabsTrigger>
          <TabsTrigger value="serviceband" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Service Band
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis" className="space-y-6">
          <Form {...form}>
            <div className="space-y-8">
              {/* Impairments Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Impairments & Accessibility</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Hearing Impairment */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ear className="h-4 w-4 text-blue-600" />
                        <FormLabel className="text-base mb-0">Hearing Impairment</FormLabel>
                      </div>
                      <FormField
                        control={form.control}
                        name="diagnosis.hearing_impaired"
                        render={({ field }) => (
                          <YesNoToggle
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                    {form.watch("diagnosis.hearing_impaired") && (
                      <FormField
                        control={form.control}
                        name="diagnosis.hearing_impairment_description"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the hearing impairment..." 
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Vision Impairment */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-600" />
                        <FormLabel className="text-base mb-0">Vision Impairment</FormLabel>
                      </div>
                      <FormField
                        control={form.control}
                        name="diagnosis.vision_impaired"
                        render={({ field }) => (
                          <YesNoToggle
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                    {form.watch("diagnosis.vision_impaired") && (
                      <FormField
                        control={form.control}
                        name="diagnosis.vision_impairment_description"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the vision impairment..." 
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Mobility Impairment */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Accessibility className="h-4 w-4 text-orange-600" />
                        <FormLabel className="text-base mb-0">Mobility Impairment</FormLabel>
                      </div>
                      <FormField
                        control={form.control}
                        name="diagnosis.mobility_impaired"
                        render={({ field }) => (
                          <YesNoToggle
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                    {form.watch("diagnosis.mobility_impaired") && (
                      <FormField
                        control={form.control}
                        name="diagnosis.mobility_impairment_description"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the mobility impairment..." 
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Communication */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      <FormLabel className="text-base mb-0">Communication Abilities</FormLabel>
                    </div>
                    <FormField
                      control={form.control}
                      name="diagnosis.communication_abilities"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what the client can do (e.g., able to speak, uses gestures, requires interpreter)..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Medical Conditions Multi-Select */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Medical Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select all applicable medical conditions
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
                    {MEDICAL_CONDITIONS_LIST.map((condition) => (
                      <div key={condition} className="flex items-center space-x-2">
                        <Checkbox
                          id={`condition-${condition}`}
                          checked={selectedConditions.includes(condition)}
                          onCheckedChange={(checked) => toggleMedicalCondition(condition, checked as boolean)}
                        />
                        <Label 
                          htmlFor={`condition-${condition}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {condition}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {/* Custom Diagnosis Option */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-2 mb-3">
                      <Checkbox
                        id="custom-diagnosis-toggle"
                        checked={showCustomInput || customDiagnoses.length > 0}
                        onCheckedChange={(checked) => setShowCustomInput(checked as boolean)}
                      />
                      <Label 
                        htmlFor="custom-diagnosis-toggle" 
                        className="text-sm font-medium cursor-pointer"
                      >
                        Other / Custom Diagnosis
                      </Label>
                    </div>

                    {(showCustomInput || customDiagnoses.length > 0) && (
                      <div className="space-y-3 pl-6">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter custom diagnosis..."
                            value={customDiagnosisInput}
                            onChange={(e) => setCustomDiagnosisInput(e.target.value)}
                            onKeyDown={handleCustomDiagnosisKeyDown}
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={addCustomDiagnosis}
                            disabled={!customDiagnosisInput.trim()}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>

                        {customDiagnoses.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {customDiagnoses.map((diagnosis: string) => (
                              <Badge 
                                key={diagnosis} 
                                variant="secondary" 
                                className="bg-purple-100 text-purple-800 flex items-center gap-1"
                              >
                                {diagnosis}
                                <button
                                  type="button"
                                  onClick={() => removeCustomDiagnosis(diagnosis)}
                                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Conditions Summary */}
                  {(selectedConditions.length > 0 || customDiagnoses.length > 0) && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Selected Conditions:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedConditions.map((condition: string) => (
                          <Badge key={condition} variant="secondary" className="bg-blue-100 text-blue-800">
                            {condition}
                          </Badge>
                        ))}
                        {customDiagnoses.map((diagnosis: string) => (
                          <Badge key={`custom-${diagnosis}`} variant="secondary" className="bg-purple-100 text-purple-800">
                            {diagnosis} (Custom)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </Form>
        </TabsContent>

        <TabsContent value="serviceband" className="space-y-6">
          <Form {...form}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Service Band Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Select applicable service band categories
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SERVICE_BAND_CATEGORIES.map((category) => (
                    <div key={category} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <Checkbox
                        id={`service-${category}`}
                        checked={serviceBandCategories.includes(category)}
                        onCheckedChange={(checked) => toggleServiceBandCategory(category, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`service-${category}`} 
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
                {serviceBandCategories.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Selected Service Bands:</p>
                    <div className="flex flex-wrap gap-2">
                      {serviceBandCategories.map((category: string) => (
                        <Badge key={category} variant="outline" className="bg-primary/10">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
