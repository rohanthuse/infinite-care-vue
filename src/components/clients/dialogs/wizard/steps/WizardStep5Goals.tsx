
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Calendar } from "lucide-react";
import { safeParseDateValue, safeFormatDate } from "@/utils/dateUtils";
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
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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

interface WizardStep5GoalsProps {
  form: UseFormReturn<any>;
}

export function WizardStep5Goals({ form }: WizardStep5GoalsProps) {
  const addGoal = () => {
    const current = form.getValues("goals") || [];
    form.setValue("goals", [...current, {
      description: "",
      target_date: null,
      priority: "medium",
      measurable_outcome: ""
    }]);
  };

  const removeGoal = (index: number) => {
    const current = form.getValues("goals") || [];
    form.setValue("goals", current.filter((_, i) => i !== index));
  };

  const rawGoals = form.watch("goals");
  const goals = Array.isArray(rawGoals) ? rawGoals : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Care Goals</h2>
        <p className="text-gray-600">
          Set specific, measurable objectives and outcomes for the care plan.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Goals</h3>
            <Button type="button" onClick={addGoal} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Goal
            </Button>
          </div>

          {goals.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <p>No goals added yet. Click "Add Goal" to create your first care goal.</p>
            </div>
          )}

          {goals.map((_, index) => (
            <div key={index} className="border rounded-lg p-6 space-y-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium">Goal {index + 1}</h4>
                <Button
                  type="button"
                  onClick={() => removeGoal(index)}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <FormField
                control={form.control}
                name={`goals.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the care goal in detail..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`goals.${index}.priority`}
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
                  name={`goals.${index}.target_date`}
                  render={({ field }) => {
                    const parsedDate = safeParseDateValue(field.value);
                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>Target Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !parsedDate && "text-muted-foreground"
                                )}
                              >
                              {safeFormatDate(parsedDate, "PPP", "Pick a target date")}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={parsedDate}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <FormField
                control={form.control}
                name={`goals.${index}.measurable_outcome`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Measurable Outcome</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="How will you measure success for this goal?"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </Form>
    </div>
  );
}
