
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WizardStep2PersonalInfoProps {
  form: UseFormReturn<any>;
}

export function WizardStep2PersonalInfo({ form }: WizardStep2PersonalInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">
          Contact details and emergency information for the client. Information has been pre-populated from the client's profile where available.
        </p>
      </div>

      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="personal_info.emergency_contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter emergency contact name" 
                    {...field} 
                    className={field.value ? "bg-blue-50 border-blue-200" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personal_info.emergency_contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact Phone</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter phone number" 
                    {...field} 
                    className={field.value ? "bg-blue-50 border-blue-200" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personal_info.emergency_contact_relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship to Client</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personal_info.gp_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GP Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter GP name" 
                    {...field} 
                    className={field.value ? "bg-green-50 border-green-200" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personal_info.gp_practice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GP Practice</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter GP practice name" 
                    {...field} 
                    className={field.value ? "bg-green-50 border-green-200" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personal_info.gp_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GP Phone</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter GP phone number" 
                    {...field} 
                    className={field.value ? "bg-green-50 border-green-200" : ""}
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
