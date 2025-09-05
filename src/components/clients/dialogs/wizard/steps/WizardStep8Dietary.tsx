import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Plus, X } from 'lucide-react';

export default function WizardStep8Dietary({ form }: { form: UseFormReturn<any> }) {
  const watchedValues = form.watch();
  const [newAllergy, setNewAllergy] = React.useState('');

  // Initialize dietary defaults if not present
  React.useEffect(() => {
    try {
      const currentDietary = form.getValues('dietary') || {};
      const defaultDietary = {
        food_allergies: [],
        at_risk_malnutrition: false,
        at_risk_dehydration: false,
        check_fridge_expiry: false,
        do_you_cook: false,
        avoid_medical_reasons: false,
        avoid_religious_reasons: false,
        nutritional_needs: '',
        feeding_assistance_required: false,
        weight_monitoring: false,
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

            <FormField
              control={form.control}
              name="dietary.check_fridge_expiry"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <FormLabel className="text-base">Check fridge & expiry dates?</FormLabel>
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
              name="dietary.do_you_cook"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <FormLabel className="text-base">Do you cook?</FormLabel>
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Extra Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Extra Information</h3>
            
            <FormField
              control={form.control}
              name="dietary.avoid_medical_reasons"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <FormLabel className="text-base">Avoid foods due to medical reasons?</FormLabel>
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietary.avoid_religious_reasons"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <FormLabel className="text-base">Avoid foods due to religious reasons?</FormLabel>
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Additional details - Collapsible */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                <ChevronDown className="h-4 w-4" />
                Additional dietary details
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 mt-4">
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
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}