import React, { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelect } from "@/components/ui/multi-select";
import { useDiagnosis } from "@/hooks/useDiagnosis";

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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [customModeEntries, setCustomModeEntries] = useState<Set<number>>(new Set());
  const [showManualDiagnosisInput, setShowManualDiagnosisInput] = useState(false);
  const [manualDiagnosisText, setManualDiagnosisText] = useState("");
  const { data: diagnosisOptions = [], isLoading: isLoadingDiagnosis } = useDiagnosis();
  
  // Custom diagnosis prefix for identifying custom entries
  const CUSTOM_PREFIX = "custom:";
  
  // Track custom diagnoses from form
  const customDiagnoses: string[] = form.watch("medical_info.custom_diagnoses") || [];
  
  // Handle adding new custom diagnosis from dropdown or manual input
  const handleAddCustomDiagnosis = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    
    const current = form.getValues("medical_info.custom_diagnoses") || [];
    if (!current.includes(trimmedValue)) {
      form.setValue("medical_info.custom_diagnoses", [...current, trimmedValue]);
      // Auto-select the new custom diagnosis
      const currentSelected = form.getValues("medical_info.medical_conditions") || [];
      form.setValue("medical_info.medical_conditions", [...currentSelected, `${CUSTOM_PREFIX}${trimmedValue}`]);
    }
  };
  
  // Handle manual diagnosis submission
  const handleManualDiagnosisSubmit = () => {
    if (manualDiagnosisText.trim()) {
      handleAddCustomDiagnosis(manualDiagnosisText.trim());
      setManualDiagnosisText("");
      setShowManualDiagnosisInput(false);
    }
  };
  

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

  const addDiagnosis = () => {
    const current = form.getValues("medical_info.current_medications") || [];
    form.setValue("medical_info.current_medications", [...current, ""]);
    // New entries start in dropdown mode (not custom)
  };
  
  const removeDiagnosis = (index: number) => {
    const current = form.getValues("medical_info.current_medications") || [];
    form.setValue("medical_info.current_medications", current.filter((_, i) => i !== index));
    // Also remove from custom mode tracking
    setCustomModeEntries(prev => {
      const newSet = new Set<number>();
      prev.forEach(i => {
        if (i < index) newSet.add(i);
        else if (i > index) newSet.add(i - 1); // Shift indices down
      });
      return newSet;
    });
  };
  
  // Handle diagnosis selection from dropdown
  const handleSelectDiagnosis = (index: number, selectedId: string) => {
    if (selectedId === "custom") {
      // Switch to custom mode, clear value for fresh input
      setCustomModeEntries(prev => new Set([...prev, index]));
      handleDiagnosisChange(index, "");
      return;
    }
    
    // Selected a predefined diagnosis - exit custom mode
    setCustomModeEntries(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    
    const selectedDiagnosis = diagnosisOptions.find(d => d.id === selectedId);
    if (selectedDiagnosis) {
      handleDiagnosisChange(index, selectedDiagnosis.title);
    }
  };
  
  // Switch back to dropdown mode from custom input
  const switchToDropdownMode = (index: number) => {
    setCustomModeEntries(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    handleDiagnosisChange(index, ""); // Clear custom value
  };
  
  // Handle diagnosis value change (for custom input)
  const handleDiagnosisChange = (index: number, value: string) => {
    const current = form.getValues("medical_info.current_medications") || [];
    const updated = [...current];
    updated[index] = value;
    form.setValue("medical_info.current_medications", updated);
  };
  
  // Initialize custom mode for existing custom values on load
  useEffect(() => {
    const currentMedications = form.getValues("medical_info.current_medications") || [];
    const customIndices = new Set<number>();
    
    currentMedications.forEach((med: string, index: number) => {
      // If medication has a value but doesn't match any active diagnosis option → custom mode
      if (med && !diagnosisOptions.some(d => d.title === med && d.status?.toLowerCase() === "active")) {
        customIndices.add(index);
      }
    });
    
    if (customIndices.size > 0) {
      setCustomModeEntries(customIndices);
    }
  }, [diagnosisOptions, form]);
  const addAllergy = () => {
    const current = form.getValues("medical_info.allergies") || [];
    form.setValue("medical_info.allergies", [...current, ""]);
  };
  const removeAllergy = (index: number) => {
    const current = form.getValues("medical_info.allergies") || [];
    form.setValue("medical_info.allergies", current.filter((_, i) => i !== index));
  };
  const medications = form.watch("medical_info.current_medications") || [];
  const allergies = form.watch("medical_info.allergies") || [];
  const selectedDiagnoses = form.watch("medical_info.medical_conditions") || [];

  // Map diagnosis data to MultiSelect format - include both system and custom
  const diagnosisMultiSelectOptions = [
    ...diagnosisOptions
      .filter(d => d.status?.toLowerCase() === "active")
      .map(d => ({
        value: d.id,
        label: d.title,
        description: d.field_caption || undefined,
        isCustom: false
      })),
    ...customDiagnoses.map((diagnosis: string) => ({
      value: `${CUSTOM_PREFIX}${diagnosis}`,
      label: diagnosis,
      isCustom: true
    }))
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Diagnosis</h2>
        <p className="text-gray-600">
          Complete medical history, conditions, medications, and health status.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-8">
          {/* Diagnosis - Searchable MultiSelect */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="medical_info.medical_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Diagnosis</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={diagnosisMultiSelectOptions}
                      selected={field.value || []}
                      onSelectionChange={(selected) => {
                        // Separate system and custom selections
                        const systemSelections = selected.filter(v => !v.startsWith(CUSTOM_PREFIX));
                        const customSelections = selected
                          .filter(v => v.startsWith(CUSTOM_PREFIX))
                          .map(v => v.replace(CUSTOM_PREFIX, ''));
                        
                        field.onChange(selected);
                        form.setValue("medical_info.custom_diagnoses", customSelections);
                      }}
                      placeholder={isLoadingDiagnosis ? "Loading diagnoses..." : "Search or select diagnosis..."}
                      searchPlaceholder="Search diagnoses..."
                      emptyText="No matching diagnosis found"
                      disabled={isLoadingDiagnosis}
                      allowCustom={true}
                      onCustomOptionAdd={handleAddCustomDiagnosis}
                      customPrefix={CUSTOM_PREFIX}
                      showAddManualOption={true}
                      addManualLabel="Add Diagnosis Manually"
                      onAddManualClick={() => setShowManualDiagnosisInput(true)}
                    />
                  </FormControl>
                  
                  {/* Manual diagnosis inline input */}
                  {showManualDiagnosisInput && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Enter diagnosis name..."
                        value={manualDiagnosisText}
                        onChange={(e) => setManualDiagnosisText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleManualDiagnosisSubmit();
                          }
                        }}
                        autoFocus
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={handleManualDiagnosisSubmit}
                        disabled={!manualDiagnosisText.trim()}
                      >
                        Add
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setManualDiagnosisText("");
                          setShowManualDiagnosisInput(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Current Diagnosis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel className="text-base font-medium">Current Diagnosis</FormLabel>
              <Button type="button" onClick={addDiagnosis} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Diagnosis
              </Button>
            </div>
            {medications.map((medication, index) => {
              const isCustomMode = customModeEntries.has(index);
              const matchedDiagnosis = diagnosisOptions.find(d => d.title === medication && d.status === "Active");
              
              return (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    {isCustomMode ? (
                      // CUSTOM MODE: Show only input field
                      <>
                        <Input
                          placeholder="Enter custom diagnosis name"
                          value={medication || ""}
                          onChange={(e) => handleDiagnosisChange(index, e.target.value)}
                          autoFocus
                          className="w-full"
                        />
                        <button 
                          type="button"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                          onClick={() => switchToDropdownMode(index)}
                        >
                          ← Select from list instead
                        </button>
                      </>
                    ) : (
                      // DROPDOWN MODE: Show only select
                      <Select
                        value={matchedDiagnosis?.id || ""}
                        onValueChange={(selectedId) => handleSelectDiagnosis(index, selectedId)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select diagnosis...">
                            {medication || "Select diagnosis..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {diagnosisOptions
                            .filter(d => d.status === "Active")
                            .map((diagnosis) => (
                              <SelectItem key={diagnosis.id} value={diagnosis.id}>
                                {diagnosis.title}
                              </SelectItem>
                            ))}
                          <SelectItem value="custom" className="text-primary border-t mt-1 pt-1">
                            ✏️ Enter custom diagnosis...
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <Button type="button" onClick={() => removeDiagnosis(index)} size="sm" variant="outline" className="mt-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
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

          {/* Service Band Categories Section - Now integrated below health conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Service Band Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                              {/* Type of learning disability */}
                              <FormField 
                                control={form.control} 
                                name={`medical_info.service_band.details.${categoryKey}.disability_type`} 
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type of learning disability</FormLabel>
                                    <FormControl>
                                      <RadioGroup 
                                        value={field.value} 
                                        onValueChange={field.onChange} 
                                        className="flex flex-col gap-3"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="mild" id={`${categoryKey}-mild`} />
                                          <Label htmlFor={`${categoryKey}-mild`}>Mild</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="moderate" id={`${categoryKey}-moderate`} />
                                          <Label htmlFor={`${categoryKey}-moderate`}>Moderate</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="severe" id={`${categoryKey}-severe`} />
                                          <Label htmlFor={`${categoryKey}-severe`}>Severe</Label>
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

                              {/* Other learning disability text field - only show if "Other" is selected */}
                              {form.watch(`medical_info.service_band.details.${categoryKey}.disability_type`) === "other" && (
                                <FormField 
                                  control={form.control} 
                                  name={`medical_info.service_band.details.${categoryKey}.other_disability_type`} 
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Please specify other learning disability type</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="Enter other learning disability type..." 
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )} 
                                />
                              )}

                              {/* Verbal communication */}
                              <FormField 
                                control={form.control} 
                                name={`medical_info.service_band.details.${categoryKey}.verbal_communication`} 
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Is the Client verbal?</FormLabel>
                                    <FormControl>
                                      <RadioGroup 
                                        value={field.value === true ? "yes" : field.value === false ? "no" : undefined} 
                                        onValueChange={value => field.onChange(value === "yes")} 
                                        className="flex gap-6"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="yes" id={`${categoryKey}-verbal-yes`} />
                                          <Label htmlFor={`${categoryKey}-verbal-yes`}>Yes</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="no" id={`${categoryKey}-verbal-no`} />
                                          <Label htmlFor={`${categoryKey}-verbal-no`}>No</Label>
                                        </div>
                                      </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} 
                              />

                              {/* Explain about learning disability */}
                              <FormField 
                                control={form.control} 
                                name={`medical_info.service_band.details.${categoryKey}.disability_explanation`} 
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Explain about the Client's learning disability</FormLabel>
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
                            </>
                          )}

                          {/* Dementia Specific Fields */}
                          {category === "Dementia" && (
                            <>
                              {/* Type of dementia */}
                              <FormField 
                                control={form.control} 
                                name={`medical_info.service_band.details.${categoryKey}.dementia_type`} 
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>What type of dementia?</FormLabel>
                                    <FormControl>
                                      <RadioGroup 
                                        value={field.value} 
                                        onValueChange={field.onChange} 
                                        className="flex flex-col gap-3"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="alzheimers" id={`${categoryKey}-alzheimers`} />
                                          <Label htmlFor={`${categoryKey}-alzheimers`}>Alzheimer's</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="vascular" id={`${categoryKey}-vascular`} />
                                          <Label htmlFor={`${categoryKey}-vascular`}>Vascular</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="frontotemporal" id={`${categoryKey}-frontotemporal`} />
                                          <Label htmlFor={`${categoryKey}-frontotemporal`}>Frontotemporal (FTD)</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="lewy_body" id={`${categoryKey}-lewy-body`} />
                                          <Label htmlFor={`${categoryKey}-lewy-body`}>Lewy Body</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="unknown" id={`${categoryKey}-unknown`} />
                                          <Label htmlFor={`${categoryKey}-unknown`}>Unknown</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="other" id={`${categoryKey}-other-dementia`} />
                                          <Label htmlFor={`${categoryKey}-other-dementia`}>Other</Label>
                                        </div>
                                      </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} 
                              />

                              {/* Other dementia type text field - only show if "Other" is selected */}
                              {form.watch(`medical_info.service_band.details.${categoryKey}.dementia_type`) === "other" && (
                                <FormField 
                                  control={form.control} 
                                  name={`medical_info.service_band.details.${categoryKey}.other_dementia_type`} 
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Please specify other dementia type</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="Enter other dementia type..." 
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )} 
                                />
                              )}

                              {/* Dementia severity */}
                              <FormField 
                                control={form.control} 
                                name={`medical_info.service_band.details.${categoryKey}.dementia_severity`} 
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>What is the severity?</FormLabel>
                                    <FormControl>
                                      <RadioGroup 
                                        value={field.value} 
                                        onValueChange={field.onChange} 
                                        className="flex flex-col gap-3"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="mild" id={`${categoryKey}-severity-mild`} />
                                          <Label htmlFor={`${categoryKey}-severity-mild`}>Mild</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="moderate" id={`${categoryKey}-severity-moderate`} />
                                          <Label htmlFor={`${categoryKey}-severity-moderate`}>Moderate</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="advanced" id={`${categoryKey}-severity-advanced`} />
                                          <Label htmlFor={`${categoryKey}-severity-advanced`}>Advanced (late stage)</Label>
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

                              {/* Other Professionals Section */}
                              <div className="border-t pt-4 space-y-4">
                                <h5 className="font-medium text-foreground">Other Professionals</h5>

                                <FormField 
                                  control={form.control} 
                                  name={`medical_info.service_band.details.${categoryKey}.other_professionals.day_centre`} 
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Does the Client attend a Day Centre?</FormLabel>
                                      <FormControl>
                                        <RadioGroup 
                                          value={field.value === true ? "yes" : field.value === false ? "no" : undefined} 
                                          onValueChange={value => field.onChange(value === "yes")} 
                                          className="flex gap-6"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="yes" id={`${categoryKey}-day-centre-yes`} />
                                            <Label htmlFor={`${categoryKey}-day-centre-yes`}>Yes</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="no" id={`${categoryKey}-day-centre-no`} />
                                            <Label htmlFor={`${categoryKey}-day-centre-no`}>No</Label>
                                          </div>
                                        </RadioGroup>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )} 
                                />

                                <FormField 
                                  control={form.control} 
                                  name={`medical_info.service_band.details.${categoryKey}.other_professionals.social_services`} 
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Is the Client open to Social Services?</FormLabel>
                                      <FormControl>
                                        <RadioGroup 
                                          value={field.value === true ? "yes" : field.value === false ? "no" : undefined} 
                                          onValueChange={value => field.onChange(value === "yes")} 
                                          className="flex gap-6"
                                        >
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="yes" id={`${categoryKey}-social-yes`} />
                                            <Label htmlFor={`${categoryKey}-social-yes`}>Yes</Label>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="no" id={`${categoryKey}-social-no`} />
                                            <Label htmlFor={`${categoryKey}-social-no`}>No</Label>
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
                                      <FormLabel>Is the Client open to the Mental Health Team?</FormLabel>
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
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

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
            </CardContent>
          </Card>
        </div>
      </Form>
    </div>
  );
}
