
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

const formSchema = z.object({
  // New fields from the image
  at_risk_malnutrition: z.boolean().optional().default(false),
  malnutrition_items: z.array(z.string()).optional().default([]),
  at_risk_dehydration: z.boolean().optional().default(false),
  dehydration_items: z.array(z.string()).optional().default([]),
  check_fridge_expiry: z.boolean().optional().default(false),
  fridge_expiry_items: z.array(z.string()).optional().default([]),
  do_you_cook: z.boolean().optional().default(false),
  cooking_items: z.array(z.string()).optional().default([]),
  avoid_medical_reasons: z.boolean().optional().default(false),
  medical_avoidance_items: z.array(z.string()).optional().default([]),
  avoid_religious_reasons: z.boolean().optional().default(false),
  religious_avoidance_items: z.array(z.string()).optional().default([]),
  
  // Legacy fields
  has_allergies: z.enum(["yes", "no"]).optional(),
  needs_cooking_help: z.enum(["yes", "no"]).optional(),
  religious_cultural_requirements: z.enum(["yes", "no"]).optional(),
  swallowing_concerns: z.enum(["yes", "no"]).optional(),
  needs_help_cutting_food: z.enum(["yes", "no"]).optional(),
  meal_schedule_requirements: z.enum(["yes", "no"]).optional(),
  hydration_support: z.enum(["yes", "no"]).optional(),
  food_prep_instructions: z.string().optional(),
  religious_cultural_details: z.string().optional(),
  swallowing_details: z.string().optional(),
  cutting_food_details: z.string().optional(),
  meal_schedule_details: z.string().optional(),
  hydration_details: z.string().optional(),
  
  // Existing fields
  dietary_restrictions: z.array(z.string()).optional().default([]),
  food_allergies: z.array(z.string()).optional().default([]),
  food_preferences: z.array(z.string()).optional().default([]),
  meal_schedule: z.any().optional(),
  nutritional_needs: z.string().optional().default(""),
  supplements: z.array(z.string()).optional().default([]),
  feeding_assistance_required: z.boolean().optional().default(false),
  special_equipment_needed: z.string().optional().default(""),
  texture_modifications: z.string().optional().default(""),
  fluid_restrictions: z.string().optional().default(""),
  weight_monitoring: z.boolean().optional().default(false),
});

interface EditDietaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  dietaryRequirements?: any;
  isLoading?: boolean;
}

export const EditDietaryDialog: React.FC<EditDietaryDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  dietaryRequirements,
  isLoading = false,
}) => {
  const [newRestriction, setNewRestriction] = React.useState("");
  const [newAllergy, setNewAllergy] = React.useState("");
  const [newPreference, setNewPreference] = React.useState("");
  const [newSupplement, setNewSupplement] = React.useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // New fields from the image
      at_risk_malnutrition: dietaryRequirements?.at_risk_malnutrition || false,
      malnutrition_items: dietaryRequirements?.malnutrition_items || [],
      at_risk_dehydration: dietaryRequirements?.at_risk_dehydration || false,
      dehydration_items: dietaryRequirements?.dehydration_items || [],
      check_fridge_expiry: dietaryRequirements?.check_fridge_expiry || false,
      fridge_expiry_items: dietaryRequirements?.fridge_expiry_items || [],
      do_you_cook: dietaryRequirements?.do_you_cook || false,
      cooking_items: dietaryRequirements?.cooking_items || [],
      avoid_medical_reasons: dietaryRequirements?.avoid_medical_reasons || false,
      medical_avoidance_items: dietaryRequirements?.medical_avoidance_items || [],
      avoid_religious_reasons: dietaryRequirements?.avoid_religious_reasons || false,
      religious_avoidance_items: dietaryRequirements?.religious_avoidance_items || [],
      
      // Legacy fields
      has_allergies: dietaryRequirements?.has_allergies || "no",
      needs_cooking_help: dietaryRequirements?.needs_cooking_help || "no",
      religious_cultural_requirements: dietaryRequirements?.religious_cultural_requirements || "no",
      swallowing_concerns: dietaryRequirements?.swallowing_concerns || "no",
      needs_help_cutting_food: dietaryRequirements?.needs_help_cutting_food || "no",
      meal_schedule_requirements: dietaryRequirements?.meal_schedule_requirements || "no",
      hydration_support: dietaryRequirements?.hydration_support || "no",
      food_prep_instructions: dietaryRequirements?.food_prep_instructions || "",
      religious_cultural_details: dietaryRequirements?.religious_cultural_details || "",
      swallowing_details: dietaryRequirements?.swallowing_details || "",
      cutting_food_details: dietaryRequirements?.cutting_food_details || "",
      meal_schedule_details: dietaryRequirements?.meal_schedule_details || "",
      hydration_details: dietaryRequirements?.hydration_details || "",
      
      // Existing fields
      dietary_restrictions: dietaryRequirements?.dietary_restrictions || [],
      food_allergies: dietaryRequirements?.food_allergies || [],
      food_preferences: dietaryRequirements?.food_preferences || [],
      meal_schedule: dietaryRequirements?.meal_schedule || null,
      nutritional_needs: dietaryRequirements?.nutritional_needs || "",
      supplements: dietaryRequirements?.supplements || [],
      feeding_assistance_required: dietaryRequirements?.feeding_assistance_required || false,
      special_equipment_needed: dietaryRequirements?.special_equipment_needed || "",
      texture_modifications: dietaryRequirements?.texture_modifications || "",
      fluid_restrictions: dietaryRequirements?.fluid_restrictions || "",
      weight_monitoring: dietaryRequirements?.weight_monitoring || false,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
    form.reset();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setNewRestriction("");
      setNewAllergy("");
      setNewPreference("");
      setNewSupplement("");
    }
    onOpenChange(newOpen);
  };

  const addArrayItem = (field: string, value: string, setter: (value: string) => void) => {
    if (value.trim()) {
      const currentValues = form.getValues(field as any) || [];
      form.setValue(field as any, [...currentValues, value.trim()]);
      setter("");
    }
  };

  const removeArrayItem = (field: string, index: number) => {
    const currentValues = form.getValues(field as any) || [];
    form.setValue(field as any, currentValues.filter((_: any, i: number) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Nutrition Plan</DialogTitle>
          <DialogDescription>
            Update dietary requirements and nutritional information for this client.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Dietary Restrictions */}
            <FormField
              control={form.control}
              name="dietary_restrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dietary Restrictions</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add dietary restriction..."
                          value={newRestriction}
                          onChange={(e) => setNewRestriction(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addArrayItem('dietary_restrictions', newRestriction, setNewRestriction);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addArrayItem('dietary_restrictions', newRestriction, setNewRestriction)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(field.value || []).map((item: string, index: number) => (
                          <Badge key={index} variant="destructive" className="flex items-center gap-1">
                            {item}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeArrayItem('dietary_restrictions', index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Food Allergies */}
            <FormField
              control={form.control}
              name="food_allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Allergies</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add food allergy..."
                          value={newAllergy}
                          onChange={(e) => setNewAllergy(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addArrayItem('food_allergies', newAllergy, setNewAllergy);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addArrayItem('food_allergies', newAllergy, setNewAllergy)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(field.value || []).map((item: string, index: number) => (
                          <Badge key={index} variant="destructive" className="flex items-center gap-1">
                            {item}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeArrayItem('food_allergies', index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Food Preferences */}
            <FormField
              control={form.control}
              name="food_preferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Preferences</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add food preference..."
                          value={newPreference}
                          onChange={(e) => setNewPreference(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addArrayItem('food_preferences', newPreference, setNewPreference);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addArrayItem('food_preferences', newPreference, setNewPreference)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(field.value || []).map((item: string, index: number) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {item}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeArrayItem('food_preferences', index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nutritional Needs */}
            <FormField
              control={form.control}
              name="nutritional_needs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nutritional Needs</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe specific nutritional needs..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Supplements */}
            <FormField
              control={form.control}
              name="supplements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplements</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add supplement..."
                          value={newSupplement}
                          onChange={(e) => setNewSupplement(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addArrayItem('supplements', newSupplement, setNewSupplement);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addArrayItem('supplements', newSupplement, setNewSupplement)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(field.value || []).map((item: string, index: number) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {item}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeArrayItem('supplements', index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Special Equipment */}
              <FormField
                control={form.control}
                name="special_equipment_needed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Equipment Needed</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Feeding tube, Special utensils" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Texture Modifications */}
              <FormField
                control={form.control}
                name="texture_modifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texture Modifications</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Pureed, Minced, Soft" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fluid Restrictions */}
            <FormField
              control={form.control}
              name="fluid_restrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fluid Restrictions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe any fluid restrictions or hydration requirements..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Feeding Assistance */}
              <FormField
                control={form.control}
                name="feeding_assistance_required"
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

              {/* Weight Monitoring */}
              <FormField
                control={form.control}
                name="weight_monitoring"
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
