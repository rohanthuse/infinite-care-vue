
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useBranchStaff } from "@/hooks/useBranchStaff";
import { useParams } from "react-router-dom";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface WizardStep1BasicInfoProps {
  form: UseFormReturn<any>;
}

export function WizardStep1BasicInfo({ form }: WizardStep1BasicInfoProps) {
  const { id: branchId } = useParams();
  const { data: branchStaff = [], isLoading: isLoadingStaff } = useBranchStaff(branchId || '');
  const [providerType, setProviderType] = React.useState<"staff" | "external">("staff");

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'provider_type') {
        setProviderType(value.provider_type);
        if (value.provider_type === "staff") {
          form.setValue("provider_name", "");
        } else {
          form.setValue("staff_id", "");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-gray-600">
          Start by providing the essential details for this care plan.
        </p>
      </div>

      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Care Plan Title *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Comprehensive Personal Care Plan"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="provider_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="staff">Internal Staff Member</SelectItem>
                    <SelectItem value="external">External Provider</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {providerType === "staff" ? (
            <FormField
              control={form.control}
              name="staff_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Staff Member *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoadingStaff}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingStaff ? "Loading staff..." : "Select a staff member"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branchStaff.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.first_name} {staff.last_name}
                          {staff.specialization && ` - ${staff.specialization}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="provider_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External Provider Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Dr. John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="care_plan_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Care Plan Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="standard">Standard Care Plan</SelectItem>
                    <SelectItem value="intensive">Intensive Care Plan</SelectItem>
                    <SelectItem value="respite">Respite Care Plan</SelectItem>
                    <SelectItem value="palliative">Palliative Care Plan</SelectItem>
                    <SelectItem value="rehabilitation">Rehabilitation Plan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="review_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Review Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  );
}
