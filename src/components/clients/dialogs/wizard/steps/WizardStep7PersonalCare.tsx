
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WizardStep7PersonalCareProps {
  form: UseFormReturn<any>;
}

export function WizardStep7PersonalCare({ form }: WizardStep7PersonalCareProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Personal Care</h2>
        <p className="text-gray-600">
          Daily living assistance and personal care requirements.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="personal_care.dressing_assistance_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dressing Assistance Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assistance level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="independent">Independent</SelectItem>
                      <SelectItem value="minimal_assistance">Minimal Assistance</SelectItem>
                      <SelectItem value="moderate_assistance">Moderate Assistance</SelectItem>
                      <SelectItem value="full_assistance">Full Assistance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personal_care.toileting_assistance_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Toileting Assistance Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assistance level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="independent">Independent</SelectItem>
                      <SelectItem value="minimal_assistance">Minimal Assistance</SelectItem>
                      <SelectItem value="moderate_assistance">Moderate Assistance</SelectItem>
                      <SelectItem value="full_assistance">Full Assistance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personal_care.continence_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Continence Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="continent">Continent</SelectItem>
                      <SelectItem value="occasional_accidents">Occasional Accidents</SelectItem>
                      <SelectItem value="incontinent">Incontinent</SelectItem>
                      <SelectItem value="catheter">Catheter</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="personal_care.bathing_preferences"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bathing Preferences</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe bathing preferences, frequency, temperature, special requirements..."
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
            name="personal_care.personal_hygiene_needs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personal Hygiene Needs</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe personal hygiene assistance requirements..."
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
            name="personal_care.sleep_patterns"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sleep Patterns</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe sleep schedule, habits, and any sleep-related issues..."
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personal_care.skin_care_needs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skin Care Needs</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe any special skin care requirements, conditions, or treatments..."
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personal_care.pain_management"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pain Management</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe pain management strategies, medications, or therapies..."
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personal_care.comfort_measures"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comfort Measures</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe comfort measures, positioning, environmental preferences..."
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personal_care.behavioral_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Behavioral Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Note any behavioral patterns, triggers, or management strategies..."
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
