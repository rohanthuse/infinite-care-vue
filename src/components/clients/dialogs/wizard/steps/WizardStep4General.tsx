import React from "react";
import { UseFormReturn } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";

interface WizardStep4GeneralProps {
  form: UseFormReturn<any>;
}

export function WizardStep4General({ form }: WizardStep4GeneralProps) {
  const handleAddWarning = () => {
    const currentWarnings = form.getValues("general.warnings") || [];
    form.setValue("general.warnings", [...currentWarnings, ""]);
  };

  const handleRemoveWarning = (index: number) => {
    const currentWarnings = form.getValues("general.warnings") || [];
    form.setValue("general.warnings", currentWarnings.filter((_, i) => i !== index));
  };

  const handleAddInstruction = () => {
    const currentInstructions = form.getValues("general.instructions") || [];
    form.setValue("general.instructions", [...currentInstructions, ""]);
  };

  const handleRemoveInstruction = (index: number) => {
    const currentInstructions = form.getValues("general.instructions") || [];
    form.setValue("general.instructions", currentInstructions.filter((_, i) => i !== index));
  };

  const handleAddOccasion = () => {
    const currentOccasions = form.getValues("general.important_occasions") || [];
    form.setValue("general.important_occasions", [...currentOccasions, { occasion: "", date: "" }]);
  };

  const handleRemoveOccasion = (index: number) => {
    const currentOccasions = form.getValues("general.important_occasions") || [];
    form.setValue("general.important_occasions", currentOccasions.filter((_, i) => i !== index));
  };

  const warnings = form.watch("general.warnings") || [];
  const instructions = form.watch("general.instructions") || [];
  const occasions = form.watch("general.important_occasions") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">General</h2>
        <p className="text-gray-600">
          General preferences and safety information.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-8">
          {/* Care & Support Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Care & Support</h3>
            
            <FormField
              control={form.control}
              name="general.main_reasons_for_care"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main reasons for arranging care and support?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please describe the main reasons for arranging care and support..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="general.used_other_care_providers"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Have you previously used other care providers?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "true")}
                          value={field.value ? "true" : "false"}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="used_providers_yes" />
                            <Label htmlFor="used_providers_yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="used_providers_no" />
                            <Label htmlFor="used_providers_no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="general.fallen_past_six_months"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Have you had any falls in the past 6 months?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "true")}
                          value={field.value ? "true" : "false"}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="fallen_yes" />
                            <Label htmlFor="fallen_yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="fallen_no" />
                            <Label htmlFor="fallen_no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="general.has_assistance_device"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Do you have any assistance devices (e.g., walking frame, mobility scooter)?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "true")}
                          value={field.value ? "true" : "false"}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="has_device_yes" />
                            <Label htmlFor="has_device_yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="has_device_no" />
                            <Label htmlFor="has_device_no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="general.arrange_assistance_device"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Would you like us to arrange an assistance device for you?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "true")}
                          value={field.value ? "true" : "false"}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="arrange_device_yes" />
                            <Label htmlFor="arrange_device_yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="arrange_device_no" />
                            <Label htmlFor="arrange_device_no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="general.bereavement_past_two_years"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Have you experienced any bereavements in the past 2 years?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "true")}
                          value={field.value ? "true" : "false"}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="bereavement_yes" />
                            <Label htmlFor="bereavement_yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="bereavement_no" />
                            <Label htmlFor="bereavement_no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Warning And Instructions Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Warning And Instructions</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Warning:</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddWarning}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Warning
                  </Button>
                </div>
                <div className="space-y-2">
                  {warnings.map((warning: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Enter warning..."
                        value={warning}
                        onChange={(e) => {
                          const newWarnings = [...warnings];
                          newWarnings[index] = e.target.value;
                          form.setValue("general.warnings", newWarnings);
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWarning(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {warnings.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No warnings added yet.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Instructions:</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddInstruction}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Instruction
                  </Button>
                </div>
                <div className="space-y-2">
                  {instructions.map((instruction: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Enter instruction..."
                        value={instruction}
                        onChange={(e) => {
                          const newInstructions = [...instructions];
                          newInstructions[index] = e.target.value;
                          form.setValue("general.instructions", newInstructions);
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveInstruction(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {instructions.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No instructions added yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Important Occasions Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Important Occasions</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOccasion}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="border rounded-lg">
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b font-medium text-sm">
                <div>Occasion</div>
                <div>Date</div>
                <div>Actions</div>
              </div>
              
              {occasions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No records found
                </div>
              ) : (
                <div className="divide-y">
                  {occasions.map((occasion: any, index: number) => (
                    <div key={index} className="grid grid-cols-3 gap-4 p-4 items-center">
                      <Input
                        placeholder="Occasion name..."
                        value={occasion.occasion || ""}
                        onChange={(e) => {
                          const newOccasions = [...occasions];
                          newOccasions[index] = { ...newOccasions[index], occasion: e.target.value };
                          form.setValue("general.important_occasions", newOccasions);
                        }}
                      />
                      <Input
                        type="date"
                        value={occasion.date || ""}
                        onChange={(e) => {
                          const newOccasions = [...occasions];
                          newOccasions[index] = { ...newOccasions[index], date: e.target.value };
                          form.setValue("general.important_occasions", newOccasions);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOccasion(index)}
                        className="text-red-500 hover:text-red-700 justify-start"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}