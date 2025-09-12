import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSuspendClient } from "@/hooks/useClientSuspensions";
import { toast } from "sonner";

const suspendFormSchema = z.object({
  fromDateTime: z.string().min(1, "From date is required"),
  untilDateTime: z.string().optional(),
  reason: z.string().min(1, "This field is required"),
  description: z.string().optional(),
  removeFromInvoice: z.boolean().default(false),
  payStaff: z.boolean().default(false),
});

type SuspendFormValues = z.infer<typeof suspendFormSchema>;

interface SuspendTabProps {
  clientId: string;
}

const reasonOptions = [
  "Hospital Admission",
  "Holiday", 
  "Staying with Family",
  "A Family Member Helping",
  "Other"
];

export const SuspendTab: React.FC<SuspendTabProps> = ({ clientId }) => {
  const suspendMutation = useSuspendClient();

  const form = useForm<SuspendFormValues>({
    resolver: zodResolver(suspendFormSchema),
    defaultValues: {
      fromDateTime: "",
      untilDateTime: "",
      reason: "",
      description: "",
      removeFromInvoice: false,
      payStaff: false,
    },
  });

  const onSubmit = async (values: SuspendFormValues) => {
    try {
      await suspendMutation.mutateAsync({
        clientId,
        data: {
          suspension_type: "temporary",
          reason: values.reason,
          details: values.description || null,
          effective_from: new Date(values.fromDateTime).toISOString(),
          effective_until: values.untilDateTime ? new Date(values.untilDateTime).toISOString() : null,
          apply_to: {
            visits: true,
            serviceActions: true,
            billing: !values.removeFromInvoice,
            messaging: false,
          },
          notify: {
            client: false,
            nextOfKin: false,
            carers: !values.payStaff,
            admin: true,
            ccEmails: [],
          },
          attachments: [],
        },
      });
      toast.success("Client suspended successfully");
      form.reset();
    } catch (error) {
      toast.error("Failed to suspend client");
      console.error("Error suspending client:", error);
    }
  };

  const handleCancel = () => {
    form.reset();
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="bg-blue-500 text-white px-6 py-4 rounded-t-lg">
        <h2 className="text-lg font-semibold">New Suspend</h2>
      </div>
      
      {/* Form */}
      <div className="bg-white border border-t-0 rounded-b-lg p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* From Field */}
            <FormField
              control={form.control}
              name="fromDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    From <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      placeholder="dd-mm-yyyy hh:mm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Until Field */}
            <FormField
              control={form.control}
              name="untilDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Until</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      placeholder="dd-mm-yyyy hh:mm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason Field */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Reason <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reasonOptions.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter additional details..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Checkboxes */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="removeFromInvoice"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">Remove from invoice</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payStaff"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">Pay Staff</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700"
                disabled={suspendMutation.isPending}
              >
                {suspendMutation.isPending ? "Suspending..." : "Suspend"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};