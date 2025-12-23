import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ImmediateActionsSectionProps {
  form: UseFormReturn<any>;
  staffList: Array<{ id: string; first_name: string; last_name: string }>;
}

export function ImmediateActionsSection({ form, staffList }: ImmediateActionsSectionProps) {
  const investigationRequired = form.watch('investigation_required');

  return (
    <div className="space-y-4 bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-foreground border-b border-gray-100 dark:border-border pb-2">
        Immediate Actions & Investigation
      </h3>
      
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="immediate_actions_taken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Immediate Actions Taken</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe any immediate actions taken at the time of the event..."
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
          name="investigation_required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-medium">
                  Investigation Required
                </FormLabel>
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  Check if this event requires formal investigation
                </p>
              </div>
            </FormItem>
          )}
        />

        {investigationRequired && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6 pl-4 border-l-2 border-orange-100">
            <FormField
              control={form.control}
              name="investigation_assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investigation Assigned To</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select investigator" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staffList.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.first_name} {staff.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_resolution_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Resolution Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}