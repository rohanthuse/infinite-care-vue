
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays } from "date-fns";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { DateTimePickerField } from "@/components/third-party-access/DateTimePickerField";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Save, Clock, X } from "lucide-react";
import { useThirdPartyAccess } from "@/hooks/useThirdPartyAccess";

interface ThirdPartyAccessFormProps {
  branchId: string;
  onRequestCreated?: () => void;
  onCancel?: () => void;
}

// Form schema with validation
const formSchema = z.object({
  requestFor: z.enum(["client", "staff", "both"], {
    required_error: "Please select who this request is for",
  }),
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  organisation: z.string().optional(),
  role: z.string().optional(),
  clientConsentRequired: z.enum(["yes", "no"], {
    required_error: "Please specify if client consent is required",
  }),
  reasonForAccess: z.string().min(1, "Reason for access is required"),
  accessFrom: z.date({
    required_error: "Please select a start date and time",
  }),
  accessUntil: z.date().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
}).refine(
  (data) => {
    if (data.accessUntil) {
      return data.accessUntil > data.accessFrom;
    }
    return true;
  },
  {
    message: "Access until date must be after access from date",
    path: ["accessUntil"],
  }
);

type FormValues = z.infer<typeof formSchema>;

export const ThirdPartyAccessForm = ({
  branchId,
  onRequestCreated,
  onCancel,
}: ThirdPartyAccessFormProps) => {
  const { createRequest, isCreating } = useThirdPartyAccess(branchId);

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestFor: "client",
      firstName: "",
      surname: "",
      email: "",
      organisation: "",
      role: "",
      clientConsentRequired: "yes",
      reasonForAccess: "",
      accessFrom: new Date(),
      accessUntil: addDays(new Date(), 7),
      agreeToTerms: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    console.log("Form submitted:", data);
    
    createRequest({
      first_name: data.firstName,
      surname: data.surname,
      email: data.email,
      organisation: data.organisation || undefined,
      role: data.role || undefined,
      request_for: data.requestFor,
      client_consent_required: data.clientConsentRequired === "yes",
      reason_for_access: data.reasonForAccess,
      access_from: data.accessFrom,
      access_until: data.accessUntil,
    });

    // Call the callback function if provided
    if (onRequestCreated) {
      onRequestCreated();
    }
    
    // Reset the form
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-semibold">User Properties</h3>
              <div className="h-0.5 bg-gray-100 flex-grow ml-4"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="requestFor"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Request For</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="client" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Client
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="staff" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Staff
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="both" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Both
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="surname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surname <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter surname" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organisation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organisation</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter organisation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter role" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="clientConsentRequired"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Client Consent Required</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="yes" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Yes
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              No
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="reasonForAccess"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Access</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please describe the reason for this access request"
                          className="min-h-[100px]"
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
                name="accessFrom"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Access From <span className="text-red-500">*</span></FormLabel>
                    <DateTimePickerField
                      date={field.value}
                      setDate={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessUntil"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Access Until</FormLabel>
                    <DateTimePickerField
                      date={field.value || undefined}
                      setDate={field.onChange}
                    />
                    <FormDescription>
                      If not specified, access will be indefinite
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-1 md:col-span-2 pt-4">
                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-gray-50">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          I agree to the terms and conditions for third-party access
                        </FormLabel>
                        <FormDescription>
                          By checking this box, you confirm that this access request complies with 
                          Med-Infinite's security and data protection policies.
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end space-x-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isCreating} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isCreating ? "Creating..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
