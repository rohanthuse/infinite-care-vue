
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ReferralQuestionsProps {
  form: UseFormReturn<any>;
}

export function ReferralQuestions({ form }: ReferralQuestionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="referredToSafeguarding"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Referred to Safeguarding?</FormLabel>
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
      
      <FormField
        control={form.control}
        name="reportedToPolice"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Reported to Police?</FormLabel>
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
      
      <FormField
        control={form.control}
        name="reportedToRegulator"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Reported to Regulator?</FormLabel>
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
      
      <FormField
        control={form.control}
        name="followUpRequired"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Follow-up Required?</FormLabel>
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
    </div>
  );
}
