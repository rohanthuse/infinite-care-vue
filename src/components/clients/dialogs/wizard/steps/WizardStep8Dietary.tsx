import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Droplets, TrendingUp, TrendingDown } from 'lucide-react';
import { FluidBalanceRecordDialog } from '@/components/fluid-balance/FluidBalanceRecordDialog';
import { useFluidBalanceTarget, useUpdateFluidBalanceTarget } from '@/hooks/useFluidBalanceTargets';
import { useFluidIntakeSummary } from '@/hooks/useFluidIntakeRecords';
import { useFluidOutputSummary } from '@/hooks/useFluidOutputRecords';
import { format } from 'date-fns';

export default function WizardStep8Dietary({ form, clientId }: { form: UseFormReturn<any>; clientId: string }) {
  const watchedValues = form.watch();
  const [newAllergy, setNewAllergy] = React.useState('');
  const [newRestriction, setNewRestriction] = React.useState('');
  const [newPreference, setNewPreference] = React.useState('');
  const [newSupplement, setNewSupplement] = React.useState('');
  const [fluidBalanceDialogOpen, setFluidBalanceDialogOpen] = useState(false);
  
  // Get client info from form
  const clientName = form.getValues('basic_info.full_name') || form.getValues('basic_info.preferred_name') || 'Client';
  
  // Fluid balance hooks
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: fluidTarget } = useFluidBalanceTarget(clientId || '');
  const { data: todayIntake } = useFluidIntakeSummary(clientId || '', today);
  const { data: todayOutput } = useFluidOutputSummary(clientId || '', today);
  const updateTargetMutation = useUpdateFluidBalanceTarget();

  // Initialize dietary defaults if not present
  React.useEffect(() => {
    try {
      const currentDietary = form.getValues('dietary') || {};
      const defaultDietary = {
        food_allergies: [],
        dietary_restrictions: [],
        food_preferences: [],
        supplements: [],
        at_risk_malnutrition: false,
        at_risk_dehydration: false,
        check_fridge_expiry: false,
        do_you_cook: false,
        help_with_cooking: false,
        preparation_instructions: '',
        avoid_medical_reasons: false,
        avoid_religious_reasons: false,
        nutritional_needs: '',
        hydration_needs: '',
        feeding_assistance_required: false,
        weight_monitoring: false,
        eating_assistance: '',
        meal_preparation_needs: '',
        meal_schedule: '',
        special_equipment_needed: '',
        texture_modifications: '',
        fluid_restrictions: '',
        ...currentDietary
      };
      
      form.setValue('dietary', defaultDietary);
      console.log('Dietary defaults initialized:', defaultDietary);
    } catch (error) {
      console.error('Error initializing dietary defaults:', error);
    }
  }, [form]);

  // Helper function to add items to arrays with safety checks
  const addToArray = (fieldName: string, value: string, setter: (value: string) => void) => {
    try {
      if (value && value.trim()) {
        const current = form.getValues(fieldName);
        const currentArray = Array.isArray(current) ? current : [];
        form.setValue(fieldName, [...currentArray, value.trim()]);
        setter('');
        console.log(`Added to ${fieldName}:`, value.trim());
      }
    } catch (error) {
      console.error(`Error adding to ${fieldName}:`, error);
    }
  };

  // Helper function to remove items from arrays with safety checks
  const removeFromArray = (fieldName: string, index: number) => {
    try {
      const current = form.getValues(fieldName);
      const currentArray = Array.isArray(current) ? current : [];
      if (index >= 0 && index < currentArray.length) {
        form.setValue(fieldName, currentArray.filter((_: any, i: number) => i !== index));
        console.log(`Removed from ${fieldName} at index:`, index);
      }
    } catch (error) {
      console.error(`Error removing from ${fieldName}:`, error);
    }
  };

  return (
    <>
    <Form {...form}>
      <div className="space-y-6">
        <Card>
        <CardHeader>
          <CardTitle>Dietary Requirements</CardTitle>
          <CardDescription>
            Document the client's dietary needs, restrictions, and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Allergies Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Allergies</h3>
            <FormField
              control={form.control}
              name="dietary.food_allergies"
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
                              addToArray('dietary.food_allergies', newAllergy, setNewAllergy);
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          size="sm"
                          onClick={() => addToArray('dietary.food_allergies', newAllergy, setNewAllergy)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(field.value) && field.value.map((item: string, index: number) => (
                          <Badge key={index} variant="destructive" className="flex items-center gap-1">
                            {item}
                            <X 
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromArray('dietary.food_allergies', index)}
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
          </div>

          {/* Dietary Restrictions & Preferences Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dietary Restrictions & Preferences</h3>
            
            <FormField
              control={form.control}
              name="dietary.dietary_restrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dietary Restrictions</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Add dietary restriction (e.g., Vegetarian, Gluten-free)..."
                          value={newRestriction}
                          onChange={(e) => setNewRestriction(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToArray('dietary.dietary_restrictions', newRestriction, setNewRestriction);
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          size="sm"
                          onClick={() => addToArray('dietary.dietary_restrictions', newRestriction, setNewRestriction)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(field.value) && field.value.map((item: string, index: number) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {item}
                            <X 
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromArray('dietary.dietary_restrictions', index)}
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

            <FormField
              control={form.control}
              name="dietary.food_preferences"
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
                              addToArray('dietary.food_preferences', newPreference, setNewPreference);
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          size="sm"
                          onClick={() => addToArray('dietary.food_preferences', newPreference, setNewPreference)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(field.value) && field.value.map((item: string, index: number) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {item}
                            <X 
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromArray('dietary.food_preferences', index)}
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

            <FormField
              control={form.control}
              name="dietary.meal_schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Schedule</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe preferred meal times and schedule (e.g., Breakfast at 8am, Lunch at 12pm, Dinner at 6pm)..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Malnutrition & Dehydration Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Malnutrition & Dehydration</h3>
            
            <FormField
              control={form.control}
              name="dietary.at_risk_malnutrition"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <FormLabel className="text-base">At risk of malnutrition?</FormLabel>
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietary.at_risk_dehydration"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <FormLabel className="text-base">At risk of dehydration?</FormLabel>
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

          </div>

          {/* Cooking & Meal Preparation Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Cooking & Meal Preparation</h3>
            
            <FormField
              control={form.control}
              name="dietary.check_fridge_expiry"
              render={({ field }) => (
                <FormItem className="space-y-3 rounded-lg border p-4">
                  <FormLabel className="text-base">Do you want us to check the food conditions/expiry dates in the fridge?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value === true ? 'yes' : field.value === false ? 'no' : ''}
                      onValueChange={(value) => field.onChange(value === 'yes')}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="check_fridge_yes" />
                        <label htmlFor="check_fridge_yes">Yes</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="check_fridge_no" />
                        <label htmlFor="check_fridge_no">No</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietary.do_you_cook"
              render={({ field }) => (
                <FormItem className="space-y-3 rounded-lg border p-4">
                  <FormLabel className="text-base">Do you cook?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value === true ? 'yes' : field.value === false ? 'no' : ''}
                      onValueChange={(value) => field.onChange(value === 'yes')}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="do_cook_yes" />
                        <label htmlFor="do_cook_yes">Yes</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="do_cook_no" />
                        <label htmlFor="do_cook_no">No</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietary.help_with_cooking"
              render={({ field }) => (
                <FormItem className="space-y-3 rounded-lg border p-4">
                  <FormLabel className="text-base">Do you want us to help you with cooking?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value === true ? 'yes' : field.value === false ? 'no' : ''}
                      onValueChange={(value) => field.onChange(value === 'yes')}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="help_cooking_yes" />
                        <label htmlFor="help_cooking_yes">Yes</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="help_cooking_no" />
                        <label htmlFor="help_cooking_no">No</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietary.preparation_instructions"
              render={({ field }) => (
                <FormItem className="rounded-lg border p-4">
                  <FormLabel className="text-base">Please give us clear instructions if you want us to help you with the food preparation</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide detailed instructions for food preparation..." 
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
              name="dietary.avoid_medical_reasons"
              render={({ field }) => (
                <FormItem className="space-y-3 rounded-lg border p-4">
                  <FormLabel className="text-base">Are there any foods or ingredients that should be avoided for medical reasons?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value === true ? 'yes' : field.value === false ? 'no' : ''}
                      onValueChange={(value) => field.onChange(value === 'yes')}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="avoid_medical_yes" />
                        <label htmlFor="avoid_medical_yes">Yes</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="avoid_medical_no" />
                        <label htmlFor="avoid_medical_no">No</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietary.avoid_religious_reasons"
              render={({ field }) => (
                <FormItem className="space-y-3 rounded-lg border p-4">
                  <FormLabel className="text-base">Are there any foods or ingredients that should be avoided for religious reasons?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value === true ? 'yes' : field.value === false ? 'no' : ''}
                      onValueChange={(value) => field.onChange(value === 'yes')}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="avoid_religious_yes" />
                        <label htmlFor="avoid_religious_yes">Yes</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="avoid_religious_no" />
                        <label htmlFor="avoid_religious_no">No</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Nutritional & Hydration Needs Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Nutritional & Hydration Needs</h3>
            
            <FormField
              control={form.control}
              name="dietary.nutritional_needs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nutritional Needs</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe any specific nutritional requirements..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietary.hydration_needs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hydration Needs</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe any hydration requirements or preferences..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietary.supplements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplements</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Add supplement (e.g., Vitamin D, Iron)..."
                          value={newSupplement}
                          onChange={(e) => setNewSupplement(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToArray('dietary.supplements', newSupplement, setNewSupplement);
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          size="sm"
                          onClick={() => addToArray('dietary.supplements', newSupplement, setNewSupplement)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(field.value) && field.value.map((item: string, index: number) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {item}
                            <X 
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromArray('dietary.supplements', index)}
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
          </div>

          {/* Eating & Meal Assistance Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Eating & Meal Assistance</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dietary.feeding_assistance_required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <FormLabel className="text-base">Feeding Assistance Required</FormLabel>
                    <FormControl>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dietary.weight_monitoring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <FormLabel className="text-base">Weight Monitoring Required</FormLabel>
                    <FormControl>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dietary.eating_assistance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eating Assistance Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe any eating assistance needed (e.g., cutting food, hand-over-hand support)..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietary.meal_preparation_needs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Preparation Needs</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe specific meal preparation requirements..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Special Requirements Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Special Requirements</h3>
            
            <FormField
              control={form.control}
              name="dietary.special_equipment_needed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Equipment Needed</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List any special eating equipment (e.g., adapted cutlery, non-slip mat, feeding tube)..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietary.texture_modifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texture Modifications</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe any texture modifications needed (e.g., pureed, soft, minced)..."
                      {...field}
                    />
                  </FormControl>
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
                    <Textarea 
                      placeholder="Describe any fluid restrictions (e.g., max 1.5L per day, thickened fluids only)..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fluid Balance Management */}
      {clientId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              Fluid Balance Monitoring
            </CardTitle>
            <CardDescription>
              Set daily fluid intake and output targets, and track today's records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Today's Summary Widget */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">Today's Summary</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFluidBalanceDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record Entry
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Intake
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {todayIntake?.total || 0} ml
                  </div>
                  {fluidTarget?.daily_intake_target_ml && (
                    <div className="text-xs text-muted-foreground">
                      Target: {fluidTarget.daily_intake_target_ml} ml
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingDown className="h-4 w-4 text-orange-500" />
                    Output
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {todayOutput?.total || 0} ml
                  </div>
                  {fluidTarget?.daily_output_target_ml && (
                    <div className="text-xs text-muted-foreground">
                      Target: {fluidTarget.daily_output_target_ml} ml
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Target Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Fluid Balance Targets</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>Daily Intake Target (ml)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 2000"
                      defaultValue={fluidTarget?.daily_intake_target_ml || ''}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (value && clientId) {
                          updateTargetMutation.mutate({
                            client_id: clientId,
                            daily_intake_target_ml: value,
                            daily_output_target_ml: fluidTarget?.daily_output_target_ml,
                            alert_threshold_percentage: fluidTarget?.alert_threshold_percentage,
                            notes: fluidTarget?.notes,
                          });
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel>Daily Output Target (ml)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 1500"
                      defaultValue={fluidTarget?.daily_output_target_ml || ''}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (value && clientId) {
                          updateTargetMutation.mutate({
                            client_id: clientId,
                            daily_intake_target_ml: fluidTarget?.daily_intake_target_ml,
                            daily_output_target_ml: value,
                            alert_threshold_percentage: fluidTarget?.alert_threshold_percentage,
                            notes: fluidTarget?.notes,
                          });
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>

                <FormItem className="md:col-span-2">
                  <FormLabel>Alert Threshold (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 80 (alert when below 80% of target)"
                      defaultValue={fluidTarget?.alert_threshold_percentage || ''}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (clientId) {
                          updateTargetMutation.mutate({
                            client_id: clientId,
                            daily_intake_target_ml: fluidTarget?.daily_intake_target_ml,
                            daily_output_target_ml: fluidTarget?.daily_output_target_ml,
                            alert_threshold_percentage: value || null,
                            notes: fluidTarget?.notes,
                          });
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              </div>

              <FormItem>
                <FormLabel>Fluid Balance Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any special instructions or notes about fluid balance monitoring..."
                    defaultValue={fluidTarget?.notes || ''}
                    onBlur={(e) => {
                      if (clientId) {
                        updateTargetMutation.mutate({
                          client_id: clientId,
                          daily_intake_target_ml: fluidTarget?.daily_intake_target_ml,
                          daily_output_target_ml: fluidTarget?.daily_output_target_ml,
                          alert_threshold_percentage: fluidTarget?.alert_threshold_percentage,
                          notes: e.target.value || null,
                        });
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </Form>

    {/* Fluid Balance Record Dialog */}
    {clientId && clientName && (
      <FluidBalanceRecordDialog
        open={fluidBalanceDialogOpen}
        onOpenChange={setFluidBalanceDialogOpen}
        clientId={clientId}
        clientName={clientName}
      />
    )}
    </>
  );
}
