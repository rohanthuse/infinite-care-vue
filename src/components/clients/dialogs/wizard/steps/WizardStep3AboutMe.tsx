
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

interface WizardStep3AboutMeProps {
  form: UseFormReturn<any>;
}

export function WizardStep3AboutMe({ form }: WizardStep3AboutMeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">About Me</h2>
        <p className="text-gray-600">
          Personal preferences, interests, and important information about the client.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="about_me.life_history"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Life History</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell us about the client's background, career, family..."
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
            name="about_me.personality_traits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personality Traits</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the client's personality, preferences, and characteristics..."
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
            name="about_me.communication_style"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Communication Style</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Direct, gentle, requires patience..."
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="about_me.important_people"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Important People</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="List important people in the client's life..."
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
            name="about_me.meaningful_activities"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meaningful Activities</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Activities that bring joy and meaning to the client..."
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
