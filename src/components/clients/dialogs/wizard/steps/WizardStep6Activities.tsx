
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";

const TIME_OF_DAY_OPTIONS = [
  { label: "Morning", value: "morning" },
  { label: "Afternoon", value: "afternoon" },
  { label: "Evening", value: "evening" },
  { label: "Night", value: "night" },
  { label: "Any Time", value: "any_time" },
];

interface WizardStep6ActivitiesProps {
  form: UseFormReturn<any>;
}

export function WizardStep6Activities({ form }: WizardStep6ActivitiesProps) {
  const addActivity = () => {
    const current = form.getValues("activities") || [];
    form.setValue("activities", [...current, {
      name: "",
      description: "",
      frequency: "",
      duration: "",
      time_of_day: []
    }]);
  };

  const removeActivity = (index: number) => {
    const current = form.getValues("activities") || [];
    form.setValue("activities", current.filter((_, i) => i !== index));
  };

  const rawActivities = form.watch("activities");
  const activities = Array.isArray(rawActivities) ? rawActivities : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Activities</h2>
        <p className="text-gray-600">
          Schedule regular activities and tasks for the client's care routine.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Scheduled Activities</h3>
            <Button type="button" onClick={addActivity} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Activity
            </Button>
          </div>

          {activities.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <p>No activities scheduled yet. Click "Add Activity" to create your first activity.</p>
            </div>
          )}

          {activities.map((_, index) => (
            <div key={index} className="border rounded-lg p-6 space-y-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium">Activity {index + 1}</h4>
                <Button
                  type="button"
                  onClick={() => removeActivity(index)}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`activities.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Physical therapy, Reading time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`activities.${index}.time_of_day`}
                  render={({ field }) => {
                    // Normalize value for backward compatibility (string -> array)
                    const normalizedValue = Array.isArray(field.value) 
                      ? field.value 
                      : (field.value ? [field.value] : []);
                    
                    return (
                      <FormItem>
                        <FormLabel>Time of Day</FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={TIME_OF_DAY_OPTIONS}
                            selected={normalizedValue}
                            onSelectionChange={field.onChange}
                            placeholder="Select time slots..."
                            searchPlaceholder="Search times..."
                            emptyText="No time options found."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <FormField
                control={form.control}
                name={`activities.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the activity in detail..."
                        className="min-h-[80px]"
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
                  name={`activities.${index}.frequency`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="as_needed">As Needed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`activities.${index}.duration`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 30 minutes, 1 hour" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </Form>
    </div>
  );
}
