import React, { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Stethoscope, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface WizardStep4MedicalInfoProps {
  form: UseFormReturn<any>;
  effectiveCarePlanId?: string;
}
const PHYSICAL_HEALTH_CONDITIONS = ["Cancer", "Arthritis", "Heart Condition", "Diabetes", "Chronic Pain", "Chronic Respiratory", "Addiction", "Other Medical Conditions", "Blood Pressure", "Thyroid", "Multiple Sclerosis", "Parkinson's", "Bilateral Periventricular Leukomalacia", "Quadriplegic", "Cerebral Palsy", "Non", "Epilepsy"];
const MENTAL_HEALTH_CONDITIONS = ["Dementia", "Insomnia", "Alzheimer's Disease", "Hoarding Disorder", "Self-harm", "Phobia", "Panic Disorder", "Stress Disorder", "Schizophrenia", "Obsessive Compulsive Disorder", "Autism", "Other Mental Conditions", "Chronic Neurological", "Depression", "Non"];
const SERVICE_BAND_CATEGORIES = ["Dementia", "Sensory Impairment", "Learning Disability", "Physical Disability/Condition", "People with an Eating Disorder", "Autistic Disorder", "Neurological", "Learning Difficulty", "Mental Health", "Substance Misuse", "Older Adults"];

// Categories that use the image-spec template fields
const IMAGE_TEMPLATE_CATEGORIES = [
  "People with an Eating Disorder",
  "Autistic Disorder", 
  "Neurological",
  "Learning Difficulty",
  "Mental Health", 
  "Substance Misuse",
  "Older Adults"
];

// Helper function to convert category label to safe object key
const toKey = (label: string): string => {
  return label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
};
export function WizardStep4MedicalInfo({
  form,
  effectiveCarePlanId
}: WizardStep4MedicalInfoProps) {
  const [activeSubTab, setActiveSubTab] = useState("medical");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  

  // Service Band helper functions
  const toggleServiceBandCategory = (category: string, checked: boolean) => {
    const currentCategories = form.getValues("medical_info.service_band.categories") || [];
    const currentDetails = form.getValues("medical_info.service_band.details") || {};
    if (checked) {
      // Add category and expand it
      form.setValue("medical_info.service_band.categories", [...currentCategories, category]);
      setExpandedCategories(prev => new Set([...prev, category]));
    } else {
      // Remove category, clear its details, and collapse it
      const newCategories = currentCategories.filter((cat: string) => cat !== category);
      const newDetails = {
        ...currentDetails
      };
      delete newDetails[toKey(category)];
      form.setValue("medical_info.service_band.categories", newCategories);
      form.setValue("medical_info.service_band.details", newDetails);
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(category);
        return newSet;
      });
    }
  };

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };
  const serviceBandCategories = form.watch("medical_info.service_band.categories") || [];

  // Auto-expand selected categories on load
  useEffect(() => {
    const selectedCategories = form.getValues("medical_info.service_band.categories") || [];
    if (selectedCategories.length > 0) {
      setExpandedCategories(new Set(selectedCategories));
    }
  }, [form]);
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
  return <div className="space-y-6">
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
                {medicalConditions.map((_, index) => <div key={index} className="flex items-center gap-2">
                    <FormField control={form.control} name={`medical_info.medical_conditions.${index}`} render={({
                  field
                }) => <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Enter medical condition" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <Button type="button" onClick={() => removeMedicalCondition(index)} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>)}
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
                {medications.map((_, index) => <div key={index} className="flex items-center gap-2">
                    <FormField control={form.control} name={`medical_info.current_medications.${index}`} render={({
                  field
                }) => <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Enter medication name and dosage" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <Button type="button" onClick={() => removeMedication(index)} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>)}
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
                {allergies.map((_, index) => <div key={index} className="flex items-center gap-2">
                    <FormField control={form.control} name={`medical_info.allergies.${index}`} render={({
                  field
                }) => <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Enter allergy" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <Button type="button" onClick={() => removeAllergy(index)} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>)}
              </div>

              {/* Medical History */}
              <FormField control={form.control} name="medical_info.medical_history" render={({
              field
            }) => <FormItem>
                    <FormLabel>Medical History</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe relevant medical history..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mobility Status */}
                <FormField control={form.control} name="medical_info.mobility_status" render={({
                field
              }) => <FormItem>
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
                    </FormItem>} />

                {/* Cognitive Status */}
                <FormField control={form.control} name="medical_info.cognitive_status" render={({
                field
              }) => <FormItem>
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
                    </FormItem>} />
              </div>

              {/* Communication Needs */}
              <FormField control={form.control} name="medical_info.communication_needs" render={({
              field
            }) => <FormItem>
                    <FormLabel>Communication Needs</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe any special communication requirements..." className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Sensory Impairments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-medium">Sensory Impairments</FormLabel>
                  <Button type="button" onClick={addSensoryImpairment} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Impairment
                  </Button>
                </div>
                {sensoryImpairments.map((_, index) => <div key={index} className="flex items-center gap-2">
                    <FormField control={form.control} name={`medical_info.sensory_impairments.${index}`} render={({
                  field
                }) => <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Enter sensory impairment" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <Button type="button" onClick={() => removeSensoryImpairment(index)} size="sm" variant="outline">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>)}
              </div>

              {/* Mental Health Status */}
              <FormField control={form.control} name="medical_info.mental_health_status" render={({
              field
            }) => <FormItem>
                    <FormLabel>Mental Health Status</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe mental health status and any relevant conditions..." className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Physical and Mental Health Conditions Checkboxes */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Physical Health Conditions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Medical Physical Health Conditions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FormField control={form.control} name="medical_info.physical_health_conditions" render={({
                    field
                  }) => <FormItem>
                          <div className="grid gap-2 max-h-64 overflow-y-auto">
                            {PHYSICAL_HEALTH_CONDITIONS.map(condition => <div key={condition} className="flex items-center space-x-2">
                                <Checkbox id={`physical-${condition}`} checked={field.value?.includes(condition) || false} onCheckedChange={checked => {
                          const currentValue = field.value || [];
                          if (checked) {
                            field.onChange([...currentValue, condition]);
                          } else {
                            field.onChange(currentValue.filter((item: string) => item !== condition));
                          }
                        }} />
                                <Label htmlFor={`physical-${condition}`} className="text-sm font-normal cursor-pointer">
                                  {condition}
                                </Label>
                              </div>)}
                          </div>
                          <FormMessage />
                        </FormItem>} />
                  </CardContent>
                </Card>

                {/* Mental Health Conditions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Mental Health Conditions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <FormField control={form.control} name="medical_info.mental_health_conditions" render={({
                    field
                  }) => <FormItem>
                          <div className="grid gap-2 max-h-64 overflow-y-auto">
                            {MENTAL_HEALTH_CONDITIONS.map(condition => <div key={condition} className="flex items-center space-x-2">
                                <Checkbox id={`mental-${condition}`} checked={field.value?.includes(condition) || false} onCheckedChange={checked => {
                          const currentValue = field.value || [];
                          if (checked) {
                            field.onChange([...currentValue, condition]);
                          } else {
                            field.onChange(currentValue.filter((item: string) => item !== condition));
                          }
                        }} />
                                <Label htmlFor={`mental-${condition}`} className="text-sm font-normal cursor-pointer">
                                  {condition}
                                </Label>
                              </div>)}
                          </div>
                          <FormMessage />
                        </FormItem>} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </Form>
        </TabsContent>

        <TabsContent value="serviceband" className="space-y-6">
          <Form {...form}>
            <div className="space-y-6">
              {/* Service Band Categories */}
              <div className="space-y-4">
                <FormLabel className="text-lg font-semibold">Service Band Categories</FormLabel>
                 <div className="space-y-4">
                     {SERVICE_BAND_CATEGORIES.map(category => {
                      const categoryKey = toKey(category);
                      const isSelected = serviceBandCategories.includes(category);
                      const isExpanded = expandedCategories.has(category);
                      
                      return (
                        <div key={category} className="space-y-4">
                          <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                            <Checkbox 
                              id={`service-band-${categoryKey}`} 
                              checked={isSelected} 
                              onCheckedChange={checked => toggleServiceBandCategory(category, checked === true)} 
                            />
                            <Label htmlFor={`service-band-${categoryKey}`} className="text-sm font-medium cursor-pointer flex-1">
                              {category}
                            </Label>
                            {isSelected && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCategoryExpansion(category)}
                                className="ml-auto"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-4 w-4 mr-1" />
                                    Close
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4 mr-1" />
                                    Show details
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          
                           {/* Inline details for selected and expanded category */}
                          {isSelected && isExpanded && (
                            <div className="ml-6 p-4 border rounded-lg bg-background space-y-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-medium text-foreground">Category Details</h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCategoryExpansion(category)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Close
                                </Button>
                              </div>
                              <div className="grid gap-4">
                               {/* Sensory Impairment Specific Fields */}
                               {category === "Sensory Impairment" && (
                                 <>
                                   {/* Type of Impairment */}
                                   <FormField 
                                     control={form.control} 
                                     name={`medical_info.service_band.details.${categoryKey}.impairment_type`} 
                                     render={({ field }) => (
                                       <FormItem>
                                         <FormLabel>What is the impairment?</FormLabel>
                                         <FormControl>
                                           <RadioGroup 
                                             value={field.value} 
                                             onValueChange={field.onChange} 
                                             className="flex flex-col gap-3"
                                           >
                                             <div className="flex items-center space-x-2">
                                               <RadioGroupItem value="sight" id={`${categoryKey}-sight`} />
                                               <Label htmlFor={`${categoryKey}-sight`}>Sight</Label>
                                             </div>
                                             <div className="flex items-center space-x-2">
                                               <RadioGroupItem value="hearing" id={`${categoryKey}-hearing`} />
                                               <Label htmlFor={`${categoryKey}-hearing`}>Hearing</Label>
                                             </div>
                                             <div className="flex items-center space-x-2">
                                               <RadioGroupItem value="dual" id={`${categoryKey}-dual`} />
                                               <Label htmlFor={`${categoryKey}-dual`}>Dual</Label>
                                             </div>
                                           </RadioGroup>
                                         </FormControl>
                                         <FormMessage />
                                       </FormItem>
                                     )} 
                                   />

                                   {/* When was sensory loss acquired */}
                                   <FormField 
                                     control={form.control} 
                                     name={`medical_info.service_band.details.${categoryKey}.sensory_loss_acquired`} 
                                     render={({ field }) => (
                                       <FormItem>
                                         <FormLabel>When was the sensory loss acquired?</FormLabel>
                                         <FormControl>
                                           <RadioGroup 
                                             value={field.value} 
                                             onValueChange={field.onChange} 
                                             className="flex flex-col gap-3"
                                           >
                                             <div className="flex items-center space-x-2">
                                               <RadioGroupItem value="at_birth" id={`${categoryKey}-at-birth`} />
                                               <Label htmlFor={`${categoryKey}-at-birth`}>At birth</Label>
                                             </div>
                                             <div className="flex items-center space-x-2">
                                               <RadioGroupItem value="later" id={`${categoryKey}-later`} />
                                               <Label htmlFor={`${categoryKey}-later`}>Later</Label>
                                             </div>
                                           </RadioGroup>
                                         </FormControl>
                                         <FormMessage />
                                       </FormItem>
                                     )} 
                                   />

                                   {/* Consequences on social life */}
                                   <FormField 
                                     control={form.control} 
                                     name={`medical_info.service_band.details.${categoryKey}.social_consequences`} 
                                     render={({ field }) => (
                                       <FormItem>
                                         <FormLabel>What has been the consequences of sensory impairment on the Client social life?</FormLabel>
                                         <FormControl>
                                           <RadioGroup 
                                             value={field.value} 
                                             onValueChange={field.onChange} 
                                             className="flex flex-col gap-3"
                                           >
                                             <div className="flex items-center space-x-2">
                                               <RadioGroupItem value="no_restrictions" id={`${categoryKey}-no-restrictions`} />
                                               <Label htmlFor={`${categoryKey}-no-restrictions`}>No restrictions</Label>
                                             </div>
                                             <div className="flex items-center space-x-2">
                                               <RadioGroupItem value="social_isolation" id={`${categoryKey}-social-isolation`} />
                                               <Label htmlFor={`${categoryKey}-social-isolation`}>Social Isolation</Label>
                                             </div>
                                             <div className="flex items-center space-x-2">
                                               <RadioGroupItem value="other" id={`${categoryKey}-other`} />
                                               <Label htmlFor={`${categoryKey}-other`}>Other</Label>
                                             </div>
                                           </RadioGroup>
                                         </FormControl>
                                         <FormMessage />
                                       </FormItem>
                                     )} 
                                   />

                                   {/* Other consequences text field - only show if "Other" is selected */}
                                   {form.watch(`medical_info.service_band.details.${categoryKey}.social_consequences`) === "other" && (
                                     <FormField 
                                       control={form.control} 
                                       name={`medical_info.service_band.details.${categoryKey}.other_consequences`} 
                                       render={({ field }) => (
                                         <FormItem>
                                           <FormLabel>Please specify other consequences</FormLabel>
                                           <FormControl>
                                             <Textarea 
                                               placeholder="Enter other consequences..." 
                                               className="min-h-[80px]" 
                                               {...field} 
                                             />
                                           </FormControl>
                                           <FormMessage />
                                         </FormItem>
                                       )} 
                                     />
                                   )}
                                 </>
                               )}

                                {/* Learning Disability Specific Fields */}
                                {category === "Learning Disability" && (
                                  <>
                                    {/* Explain about Client learning disability */}
                                    <FormField 
                                      control={form.control} 
                                      name={`medical_info.service_band.details.${categoryKey}.learning_disability_explanation`} 
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Explain about Client learning disability</FormLabel>
                                          <FormControl>
                                            <Textarea 
                                              placeholder="Describe the client's learning disability..." 
                                              className="min-h-[80px]" 
                                              {...field} 
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )} 
                                    />

                                    {/* Describe Client family and social network */}
                                    <FormField 
                                      control={form.control} 
                                      name={`medical_info.service_band.details.${categoryKey}.family_social_network`} 
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Describe Client family and social network</FormLabel>
                                          <FormControl>
                                            <Textarea 
                                              placeholder="Describe the client's family and social network..." 
                                              className="min-h-[80px]" 
                                              {...field} 
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )} 
                                    />

                                    {/* Drug Misuse */}
                                    <FormField 
                                      control={form.control} 
                                      name={`medical_info.service_band.details.${categoryKey}.drug_misuse`} 
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Drug Misuse</FormLabel>
                                          <FormControl>
                                            <RadioGroup 
                                              value={field.value} 
                                              onValueChange={field.onChange} 
                                              className="flex flex-col gap-3"
                                            >
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="alcohol" id={`${categoryKey}-alcohol`} />
                                                <Label htmlFor={`${categoryKey}-alcohol`}>Alcohol</Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="drugs" id={`${categoryKey}-drugs`} />
                                                <Label htmlFor={`${categoryKey}-drugs`}>Drugs</Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="alcohol_and_drugs" id={`${categoryKey}-alcohol-drugs`} />
                                                <Label htmlFor={`${categoryKey}-alcohol-drugs`}>Alcohol and drugs</Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="none" id={`${categoryKey}-none`} />
                                                <Label htmlFor={`${categoryKey}-none`}>None</Label>
                                              </div>
                                            </RadioGroup>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )} 
                                    />

                                    {/* Risk of challenging behaviour */}
                                    <FormField 
                                      control={form.control} 
                                      name={`medical_info.service_band.details.${categoryKey}.risk_challenging_behaviour`} 
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Risk of challenging behaviour</FormLabel>
                                          <FormControl>
                                            <RadioGroup 
                                              value={field.value === true ? "yes" : field.value === false ? "no" : undefined} 
                                              onValueChange={value => field.onChange(value === "yes")} 
                                              className="flex gap-6"
                                            >
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="yes" id={`${categoryKey}-challenging-yes`} />
                                                <Label htmlFor={`${categoryKey}-challenging-yes`}>Yes</Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="no" id={`${categoryKey}-challenging-no`} />
                                                <Label htmlFor={`${categoryKey}-challenging-no`}>No</Label>
                                              </div>
                                            </RadioGroup>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )} 
                                    />

                                    {/* Risk of going AWOL */}
                                    <FormField 
                                      control={form.control} 
                                      name={`medical_info.service_band.details.${categoryKey}.risk_going_awol`} 
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Risk of going AWOL</FormLabel>
                                          <FormControl>
                                            <RadioGroup 
                                              value={field.value === true ? "yes" : field.value === false ? "no" : undefined} 
                                              onValueChange={value => field.onChange(value === "yes")} 
                                              className="flex gap-6"
                                            >
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="yes" id={`${categoryKey}-awol-yes`} />
                                                <Label htmlFor={`${categoryKey}-awol-yes`}>Yes</Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="no" id={`${categoryKey}-awol-no`} />
                                                <Label htmlFor={`${categoryKey}-awol-no`}>No</Label>
                                              </div>
                                            </RadioGroup>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )} 
                                    />

                                    {/* Tracking device */}
                                    <FormField 
                                      control={form.control} 
                                      name={`medical_info.service_band.details.${categoryKey}.tracking_device`} 
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Tracking device</FormLabel>
                                          <FormControl>
                                            <RadioGroup 
                                              value={field.value === true ? "yes" : field.value === false ? "no" : undefined} 
                                              onValueChange={value => field.onChange(value === "yes")} 
                                              className="flex gap-6"
                                            >
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="yes" id={`${categoryKey}-tracking-yes`} />
                                                <Label htmlFor={`${categoryKey}-tracking-yes`}>Yes</Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="no" id={`${categoryKey}-tracking-no`} />
                                                <Label htmlFor={`${categoryKey}-tracking-no`}>No</Label>
                                              </div>
                                            </RadioGroup>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )} 
                                    />
                                  </>
                                )}

                                {/* Physical Disability/Condition Specific Fields */}
                                {category === "Physical Disability/Condition" && (
                                  <>
                                    {/* Status Flags */}
                                    <FormField 
                                      control={form.control} 
                                      name={`medical_info.service_band.details.${categoryKey}.status_flags`} 
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Status Flags</FormLabel>
                                          <div className="grid grid-cols-2 gap-3">
                                            {["Frail", "Bed-bound", "Capable", "Other"].map((status) => (
                                              <div key={status} className="flex items-center space-x-2">
                                                <Checkbox 
                                                  id={`${categoryKey}-status-${status}`}
                                                  checked={field.value?.includes(status) || false}
                                                  onCheckedChange={(checked) => {
                                                    const currentValue = field.value || [];
                                                    if (checked) {
                                                      field.onChange([...currentValue, status]);
                                                    } else {
                                                      field.onChange(currentValue.filter((item: string) => item !== status));
                                                    }
                                                  }}
                                                />
                                                <Label htmlFor={`${categoryKey}-status-${status}`} className="cursor-pointer">
                                                  {status}
                                                </Label>
                                              </div>
                                            ))}
                                          </div>
                                          <FormMessage />
                                        </FormItem>
                                      )} 
                                    />

                                    {/* Condition Explanation */}
                                    <FormField 
                                      control={form.control} 
                                      name={`medical_info.service_band.details.${categoryKey}.condition_explanation`} 
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Explain about Client physical disability / condition</FormLabel>
                                          <FormControl>
                                            <Textarea 
                                              placeholder="Describe the client's physical disability or condition..." 
                                              className="min-h-[80px]" 
                                              {...field} 
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )} 
                                    />

                                    {/* Help in Place */}
                                    <FormField 
                                      control={form.control} 
                                      name={`medical_info.service_band.details.${categoryKey}.help_in_place`} 
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>What help is already in place?</FormLabel>
                                          <FormControl>
                                            <Textarea 
                                              placeholder="Describe what help is already in place..." 
                                              className="min-h-[80px]" 
                                              {...field} 
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )} 
                                    />

                                    {/* Social Life Restrictions */}
                                    <FormField 
                                      control={form.control} 
                                      name={`medical_info.service_band.details.${categoryKey}.social_life_restrictions`} 
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>What has been the consequences of physical disability / condition on the Client social life?</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select restriction type" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value="no_restrictions">No restrictions</SelectItem>
                                              <SelectItem value="social_isolation">Social Isolation</SelectItem>
                                              <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )} 
                                    />

                                    {/* Other Restrictions Text Field - only show if "Other" is selected */}
                                    {form.watch(`medical_info.service_band.details.${categoryKey}.social_life_restrictions`) === "other" && (
                                      <FormField 
                                        control={form.control} 
                                        name={`medical_info.service_band.details.${categoryKey}.other_restrictions`} 
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Please specify other consequences</FormLabel>
                                            <FormControl>
                                              <Textarea 
                                                placeholder="Enter other consequences..." 
                                                className="min-h-[80px]" 
                                                {...field} 
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )} 
                                      />
                                    )}
                                  </>
                                )}

                                 {/* Image Template Fields for specific categories */}
                                 {IMAGE_TEMPLATE_CATEGORIES.includes(category) && (
                                   <>
                                     {/* Status Flags */}
                                     <FormField 
                                       control={form.control} 
                                       name={`medical_info.service_band.details.${categoryKey}.status_flags`} 
                                       render={({ field }) => {
                                         // Sanitize existing values to only include new valid options
                                         const validOptions = ["Frail", "Bed-bound", "Capable", "Other"];
                                         const sanitizedValue = (field.value || []).filter((item: string) => validOptions.includes(item));
                                         
                                         // Update field value if it was sanitized
                                         if (field.value && field.value.length !== sanitizedValue.length) {
                                           field.onChange(sanitizedValue);
                                         }

                                         return (
                                           <FormItem>
                                             <FormLabel>Please tick relevant box:</FormLabel>
                                             <div className="grid grid-cols-2 gap-3">
                                               {validOptions.map((status) => (
                                                 <div key={status} className="flex items-center space-x-2">
                                                   <Checkbox 
                                                     id={`${categoryKey}-status-${status}`}
                                                     checked={sanitizedValue?.includes(status) || false}
                                                     onCheckedChange={(checked) => {
                                                       const currentValue = sanitizedValue || [];
                                                       if (checked) {
                                                         field.onChange([...currentValue, status]);
                                                       } else {
                                                         field.onChange(currentValue.filter((item: string) => item !== status));
                                                       }
                                                     }}
                                                   />
                                                   <Label htmlFor={`${categoryKey}-status-${status}`} className="cursor-pointer">
                                                     {status}
                                                   </Label>
                                                 </div>
                                               ))}
                                             </div>
                                             <FormMessage />
                                           </FormItem>
                                         );
                                       }} 
                                     />

                                     {/* Condition Explanation */}
                                     <FormField 
                                       control={form.control} 
                                       name={`medical_info.service_band.details.${categoryKey}.condition_explanation`} 
                                       render={({ field }) => (
                                         <FormItem>
                                           <FormLabel>Explain Client condition/disorder:</FormLabel>
                                           <FormControl>
                                             <Textarea 
                                               placeholder="Describe the client's condition/disorder..." 
                                               className="min-h-[80px]" 
                                               {...field} 
                                             />
                                           </FormControl>
                                           <FormMessage />
                                         </FormItem>
                                       )} 
                                     />

                                     {/* Social Life Restrictions */}
                                     <FormField 
                                       control={form.control} 
                                       name={`medical_info.service_band.details.${categoryKey}.social_life_restrictions`} 
                                       render={({ field }) => (
                                         <FormItem>
                                           <FormLabel>Has the condition put restrictions on the Client social life?</FormLabel>
                                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                                             <FormControl>
                                               <SelectTrigger>
                                                 <SelectValue placeholder="Select item …" />
                                               </SelectTrigger>
                                             </FormControl>
                                             <SelectContent className="bg-background z-50">
                                               <SelectItem value="no_restrictions">No restrictions</SelectItem>
                                               <SelectItem value="social_isolation">Social Isolation</SelectItem>
                                               <SelectItem value="other">Other</SelectItem>
                                             </SelectContent>
                                           </Select>
                                           <FormMessage />
                                         </FormItem>
                                       )} 
                                     />

                                     {/* Other Restrictions Text Field - only show if "Other" is selected */}
                                     {form.watch(`medical_info.service_band.details.${categoryKey}.social_life_restrictions`) === "other" && (
                                       <FormField 
                                         control={form.control} 
                                         name={`medical_info.service_band.details.${categoryKey}.other_restrictions`} 
                                         render={({ field }) => (
                                           <FormItem>
                                             <FormLabel>Specify:</FormLabel>
                                             <FormControl>
                                               <Input 
                                                 placeholder="Enter specification..." 
                                                 {...field} 
                                               />
                                             </FormControl>
                                             <FormMessage />
                                           </FormItem>
                                         )} 
                                       />
                                     )}

                                     {/* Help in Place */}
                                     <FormField 
                                       control={form.control} 
                                       name={`medical_info.service_band.details.${categoryKey}.help_in_place`} 
                                       render={({ field }) => (
                                         <FormItem>
                                           <FormLabel>What type of help is in place for the Client?</FormLabel>
                                           <FormControl>
                                             <Textarea 
                                               placeholder="Describe what help is in place..." 
                                               className="min-h-[80px]" 
                                               {...field} 
                                             />
                                           </FormControl>
                                           <FormMessage />
                                         </FormItem>
                                       )} 
                                     />
                                   </>
                                 )}

                                  {/* Standard fields for other categories (excluding categories with special fields and IMAGE_TEMPLATE_CATEGORIES) */}
                                  {!["Sensory Impairment", "Learning Disability", "Physical Disability/Condition"].includes(category) && !IMAGE_TEMPLATE_CATEGORIES.includes(category) && (
                                  <>
                                    {/* Risk of Wandering */}
                                    <FormField 
                                      control={form.control} 
                                      name={`medical_info.service_band.details.${categoryKey}.risk_of_wandering`} 
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Is there a risk of wandering?</FormLabel>
                                          <FormControl>
                                            <RadioGroup 
                                              value={field.value === true ? "yes" : field.value === false ? "no" : undefined} 
                                              onValueChange={value => field.onChange(value === "yes")} 
                                              className="flex gap-6"
                                            >
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="yes" id={`${categoryKey}-wandering-yes`} />
                                                <Label htmlFor={`${categoryKey}-wandering-yes`}>Yes</Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="no" id={`${categoryKey}-wandering-no`} />
                                                <Label htmlFor={`${categoryKey}-wandering-no`}>No</Label>
                                              </div>
                                            </RadioGroup>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )} 
                                    />
                                  </>
                                )}

                               {/* Instructions - with different label for categories that need specific instructions */}
                               <FormField 
                                 control={form.control} 
                                 name={`medical_info.service_band.details.${categoryKey}.instructions`} 
                                 render={({ field }) => (
                                   <FormItem>
                                       <FormLabel>
                                         {(category === "Sensory Impairment" || IMAGE_TEMPLATE_CATEGORIES.includes(category)) ? "Give specific instructions:" : "Any specific instructions or remarks:"}
                                       </FormLabel>
                                     <FormControl>
                                       <Textarea 
                                         placeholder="Enter instructions..." 
                                         className="min-h-[80px]" 
                                         {...field} 
                                       />
                                     </FormControl>
                                     <FormMessage />
                                   </FormItem>
                                 )} 
                               />

                               {/* How can we make a difference */}
                               <FormField 
                                 control={form.control} 
                                 name={`medical_info.service_band.details.${categoryKey}.difference_message`} 
                                 render={({ field }) => (
                                   <FormItem>
                                     <FormLabel>How can we make a difference in the Client life?</FormLabel>
                                     <FormControl>
                                       <Textarea 
                                         placeholder="Enter message..." 
                                         className="min-h-[80px]" 
                                         {...field} 
                                       />
                                     </FormControl>
                                     <FormMessage />
                                   </FormItem>
                                 )} 
                               />

                               {/* Other Professionals Involved */}
                               <div className="space-y-3">
                                 <FormLabel className="text-sm font-medium">Other Professionals involved</FormLabel>
                                 
                                 <FormField 
                                   control={form.control} 
                                   name={`medical_info.service_band.details.${categoryKey}.other_professionals.nursing_team`} 
                                   render={({ field }) => (
                                     <FormItem>
                                       <FormLabel>Is there a medical or nursing team involved?</FormLabel>
                                       <FormControl>
                                         <RadioGroup 
                                           value={field.value === true ? "yes" : field.value === false ? "no" : undefined} 
                                           onValueChange={value => field.onChange(value === "yes")} 
                                           className="flex gap-6"
                                         >
                                           <div className="flex items-center space-x-2">
                                             <RadioGroupItem value="yes" id={`${categoryKey}-nursing-yes`} />
                                             <Label htmlFor={`${categoryKey}-nursing-yes`}>Yes</Label>
                                           </div>
                                           <div className="flex items-center space-x-2">
                                             <RadioGroupItem value="no" id={`${categoryKey}-nursing-no`} />
                                             <Label htmlFor={`${categoryKey}-nursing-no`}>No</Label>
                                           </div>
                                         </RadioGroup>
                                       </FormControl>
                                       <FormMessage />
                                     </FormItem>
                                   )} 
                                 />

                                 <FormField 
                                   control={form.control} 
                                   name={`medical_info.service_band.details.${categoryKey}.other_professionals.mental_health_team`} 
                                   render={({ field }) => (
                                     <FormItem>
                                       <FormLabel>Is there a mental health team involved?</FormLabel>
                                       <FormControl>
                                         <RadioGroup 
                                           value={field.value === true ? "yes" : field.value === false ? "no" : undefined} 
                                           onValueChange={value => field.onChange(value === "yes")} 
                                           className="flex gap-6"
                                         >
                                           <div className="flex items-center space-x-2">
                                             <RadioGroupItem value="yes" id={`${categoryKey}-mental-yes`} />
                                             <Label htmlFor={`${categoryKey}-mental-yes`}>Yes</Label>
                                           </div>
                                           <div className="flex items-center space-x-2">
                                             <RadioGroupItem value="no" id={`${categoryKey}-mental-no`} />
                                             <Label htmlFor={`${categoryKey}-mental-no`}>No</Label>
                                           </div>
                                         </RadioGroup>
                                       </FormControl>
                                       <FormMessage />
                                     </FormItem>
                                   )} 
                                 />

                                 <FormField 
                                   control={form.control} 
                                   name={`medical_info.service_band.details.${categoryKey}.other_professionals.charity_involved`} 
                                   render={({ field }) => (
                                     <FormItem>
                                       <FormLabel>Is there a charity involved?</FormLabel>
                                       <FormControl>
                                         <RadioGroup 
                                           value={field.value === true ? "yes" : field.value === false ? "no" : undefined} 
                                           onValueChange={value => field.onChange(value === "yes")} 
                                           className="flex gap-6"
                                         >
                                           <div className="flex items-center space-x-2">
                                             <RadioGroupItem value="yes" id={`${categoryKey}-charity-yes`} />
                                             <Label htmlFor={`${categoryKey}-charity-yes`}>Yes</Label>
                                           </div>
                                           <div className="flex items-center space-x-2">
                                             <RadioGroupItem value="no" id={`${categoryKey}-charity-no`} />
                                             <Label htmlFor={`${categoryKey}-charity-no`}>No</Label>
                                           </div>
                                         </RadioGroup>
                                       </FormControl>
                                       <FormMessage />
                                     </FormItem>
                                   )} 
                  />
                </div>
                               </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
              </div>


              {/* Extra Information */}
              <FormField control={form.control} name="medical_info.service_band.extra_info" render={({
              field
            }) => <FormItem>
                    <FormLabel>Extra Information</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any additional information..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
}