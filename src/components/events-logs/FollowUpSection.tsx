import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FollowUpSectionProps {
  form: UseFormReturn<any>;
  staffList: Array<{ id: string; first_name: string; last_name: string }>;
}

export function FollowUpSection({ form, staffList }: FollowUpSectionProps) {
  const actionRequired = form.watch('action_required');

  return (
    <div className="space-y-4 bg-white dark:bg-card rounded-lg border border-gray-100 dark:border-border p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-foreground border-b border-gray-100 dark:border-border pb-2">
        Follow-up & Action Requirements
      </h3>
      
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="action_required"
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
                  Action Required
                </FormLabel>
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  Check if this event requires follow-up action
                </p>
              </div>
            </FormItem>
          )}
        />

        {actionRequired && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6 pl-4 border-l-2 border-blue-100">
            <FormField
              control={form.control}
              name="follow_up_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="follow_up_assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
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

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="follow_up_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the required actions or follow-up steps..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}