
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WizardStep8DietaryProps {
  form: UseFormReturn<any>;
}

export function WizardStep8Dietary({ form }: WizardStep8DietaryProps) {
  const addDietaryRestriction = () => {
    const current = form.getValues("dietary.dietary_restrictions") || [];
    form.setValue("dietary.dietary_restrictions", [...current, ""]);
  };

  const removeDietaryRestriction = (index: number) => {
    const current = form.getValues("dietary.dietary_restrictions") || [];
    form.setValue("dietary.dietary_restrictions", current.filter((_, i) => i !== index));
  };

  const addFoodAllergy = () => {
    const current = form.getValues("dietary.food_allergies") || [];
    form.setValue("dietary.food_allergies", [...current, ""]);
  };

  const removeFoodAllergy = (index: number) => {
    const current = form.getValues("dietary.food_allergies") || [];
    form.setValue("dietary.food_allergies", current.filter((_, i) => i !== index));
  };

  const addFoodPreference = () => {
    const current = form.getValues("dietary.food_preferences") || [];
    form.setValue("dietary.food_preferences", [...current, ""]);
  };

  const removeFoodPreference = (index: number) => {
    const current = form.getValues("dietary.food_preferences") || [];
    form.setValue("dietary.food_preferences", current.filter((_, i) => i !== index));
  };

  const addSupplement = () => {
    const current = form.getValues("dietary.supplements") || [];
    form.setValue("dietary.supplements", [...current, ""]);
  };

  const removeSupplement = (index: number) => {
    const current = form.getValues("dietary.supplements") || [];
    form.setValue("dietary.supplements", current.filter((_, i) => i !== index));
  };

  const dietaryRestrictions = form.watch("dietary.dietary_restrictions") || [];
  const foodAllergies = form.watch("dietary.food_allergies") || [];
  const foodPreferences = form.watch("dietary.food_preferences") || [];
  const supplements = form.watch("dietary.supplements") || [];
  const hasAllergies = form.watch("dietary.has_allergies");
  const atRiskMalnutrition = form.watch("dietary.at_risk_malnutrition");
  const needsCookingHelp = form.watch("dietary.needs_cooking_help");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Dietary Requirements</h2>
        <p className="text-gray-600">
          Nutrition needs, restrictions, meal preferences, and feeding requirements.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-8">
          {/* Allergy Question */}
          <FormField
            control={form.control}
            name="dietary.has_allergies"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-medium">Are you allergic to any food?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Clear allergies if "No" is selected
                      if (value === "no") {
                        form.setValue("dietary.food_allergies", []);
                      }
                    }}
                    value={field.value}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="allergies-yes" />
                      <FormLabel htmlFor="allergies-yes" className="font-normal">Yes</FormLabel>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="allergies-no" />
                      <FormLabel htmlFor="allergies-no" className="font-normal">No</FormLabel>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Malnutrition Risk Question */}
          <FormField
            control={form.control}
            name="dietary.at_risk_malnutrition"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-medium">Are you at risk of malnutrition or dehydration?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="malnutrition-yes" />
                      <FormLabel htmlFor="malnutrition-yes" className="font-normal">Yes</FormLabel>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="malnutrition-no" />
                      <FormLabel htmlFor="malnutrition-no" className="font-normal">No</FormLabel>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cooking Help Question */}
          <FormField
            control={form.control}
            name="dietary.needs_cooking_help"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-base font-medium">Do you need help with cooking or meal preparation?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="cooking-yes" />
                      <FormLabel htmlFor="cooking-yes" className="font-normal">Yes</FormLabel>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="cooking-no" />
                      <FormLabel htmlFor="cooking-no" className="font-normal">No</FormLabel>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Food Preparation Instructions */}
          {needsCookingHelp === "yes" && (
            <FormField
              control={form.control}
              name="dietary.food_prep_instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Preparation Instructions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe specific help needed with cooking or meal preparation..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Dietary Restrictions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel className="text-base font-medium">Dietary Restrictions</FormLabel>
              <Button type="button" onClick={addDietaryRestriction} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Restriction
              </Button>
            </div>
            {dietaryRestrictions.map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`dietary.dietary_restrictions.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="e.g., No salt, Low sugar, Vegetarian" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  onClick={() => removeDietaryRestriction(index)}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Food Allergies - Only show if has_allergies is "yes" */}
          {hasAllergies === "yes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-medium">Food Allergies</FormLabel>
                <Button type="button" onClick={addFoodAllergy} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Allergy
                </Button>
              </div>
              {foodAllergies.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`dietary.food_allergies.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="e.g., Nuts, Dairy, Shellfish" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    onClick={() => removeFoodAllergy(index)}
                    size="sm"
                    variant="outline"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Food Preferences */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel className="text-base font-medium">Food Preferences</FormLabel>
              <Button type="button" onClick={addFoodPreference} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Preference
              </Button>
            </div>
            {foodPreferences.map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`dietary.food_preferences.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="e.g., Likes spicy food, Prefers warm meals" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  onClick={() => removeFoodPreference(index)}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="dietary.texture_modifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texture Modifications</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select texture requirement" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="normal">Normal Texture</SelectItem>
                      <SelectItem value="soft">Soft Diet</SelectItem>
                      <SelectItem value="minced">Minced</SelectItem>
                      <SelectItem value="pureed">Pureed</SelectItem>
                      <SelectItem value="liquid">Liquid Diet</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietary.fluid_restrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fluid Restrictions</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1.5L per day, Thickened fluids" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="dietary.nutritional_needs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nutritional Needs</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe specific nutritional requirements or concerns..."
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Supplements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel className="text-base font-medium">Supplements</FormLabel>
              <Button type="button" onClick={addSupplement} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Supplement
              </Button>
            </div>
            {supplements.map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`dietary.supplements.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="e.g., Vitamin D, Protein powder" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  onClick={() => removeSupplement(index)}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="dietary.feeding_assistance_required"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Feeding Assistance Required</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietary.weight_monitoring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Weight Monitoring Required</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="dietary.special_equipment_needed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Equipment Needed</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe any special feeding equipment or adaptations needed..."
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  );
}
