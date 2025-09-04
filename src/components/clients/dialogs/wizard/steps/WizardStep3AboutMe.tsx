
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

          <FormField
            control={form.control}
            name="about_me.what_is_most_important_to_me"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What is most important to me</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="What matters most to the client..."
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
            name="about_me.how_to_communicate_with_me"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How to communicate with me</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Best ways to communicate with the client..."
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
            name="about_me.please_do"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Please do</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Things the client would like caregivers to do..."
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
            name="about_me.please_dont"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Please don't</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Things the client would prefer caregivers not to do..."
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
            name="about_me.my_wellness"
            render={({ field }) => (
              <FormItem>
                <FormLabel>My wellness</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Information about the client's wellness and wellbeing..."
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
            name="about_me.how_and_when_to_support_me"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How and when to support me</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Specific support needs and timing..."
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
            name="about_me.also_worth_knowing_about_me"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Also worth knowing about me</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional important information about the client..."
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="about_me.date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="about_me.time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="time"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="about_me.supported_to_write_this_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supported to write this by</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Name of person who helped write this..."
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
