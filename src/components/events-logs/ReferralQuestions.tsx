
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ReferralQuestionsProps {
  form: UseFormReturn<any>;
}

export function ReferralQuestions({ form }: ReferralQuestionsProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="referredToSafeguarding"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Has this been referred to safeguarding?</FormLabel>
            <FormControl>
              <RadioGroup 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="safeguarding-yes" />
                  <Label htmlFor="safeguarding-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="safeguarding-no" />
                  <Label htmlFor="safeguarding-no">No</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("referredToSafeguarding") === "yes" && (
        <div className="ml-8 mt-2">
          <Textarea 
            placeholder="Provide details about the safeguarding referral"
            className="min-h-[80px]"
          />
        </div>
      )}

      <FormField
        control={form.control}
        name="reportedToPolice"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Has this been reported to the police?</FormLabel>
            <FormControl>
              <RadioGroup 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="police-yes" />
                  <Label htmlFor="police-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="police-no" />
                  <Label htmlFor="police-no">No</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("reportedToPolice") === "yes" && (
        <div className="ml-8 mt-2">
          <Textarea 
            placeholder="Provide details about the police report"
            className="min-h-[80px]"
          />
        </div>
      )}

      <FormField
        control={form.control}
        name="reportedToRegulator"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Has this been reported to the regulator?</FormLabel>
            <FormControl>
              <RadioGroup 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="regulator-yes" />
                  <Label htmlFor="regulator-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="regulator-no" />
                  <Label htmlFor="regulator-no">No</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("reportedToRegulator") === "yes" && (
        <div className="ml-8 mt-2">
          <Textarea 
            placeholder="Provide details about the regulator report"
            className="min-h-[80px]"
          />
        </div>
      )}

      <FormField
        control={form.control}
        name="followUpRequired"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Is follow-up required?</FormLabel>
            <FormControl>
              <RadioGroup 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="followup-yes" />
                  <Label htmlFor="followup-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="followup-no" />
                  <Label htmlFor="followup-no">No</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("followUpRequired") === "yes" && (
        <div className="ml-8 mt-2">
          <Textarea 
            placeholder="Provide details about the required follow-up"
            className="min-h-[80px]"
          />
        </div>
      )}
    </div>
  );
}
