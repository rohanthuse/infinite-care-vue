import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, CheckSquare } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

const TIME_OF_DAY_OPTIONS = [
  { label: "Morning", value: "morning" },
  { label: "Afternoon", value: "afternoon" },
  { label: "Evening", value: "evening" },
  { label: "Night", value: "night" },
  { label: "Any Time", value: "any_time" },
];

const TASK_CATEGORIES = [
  { value: "personal_care", label: "Personal Care" },
  { value: "medication", label: "Medication" },
  { value: "hygiene", label: "Hygiene" },
  { value: "meals", label: "Meals" },
  { value: "mobility", label: "Mobility" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "activity", label: "Activity" },
  { value: "health_monitoring", label: "Health Monitoring" },
  { value: "communication", label: "Communication" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-800" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
];

interface WizardStepTasksProps {
  form: UseFormReturn<any>;
}

export function WizardStepTasks({ form }: WizardStepTasksProps) {
  const addTask = () => {
    const current = form.getValues("tasks") || [];
    form.setValue("tasks", [...current, {
      name: "",
      category: "personal_care",
      description: "",
      priority: "medium",
      time_of_day: [],
    }]);
  };

  const removeTask = (index: number) => {
    const current = form.getValues("tasks") || [];
    form.setValue("tasks", current.filter((_: any, i: number) => i !== index));
  };

  const rawTasks = form.watch("tasks");
  const tasks = Array.isArray(rawTasks) ? rawTasks : [];

  const getCategoryLabel = (value: string) => {
    return TASK_CATEGORIES.find(c => c.value === value)?.label || value;
  };

  const getPriorityConfig = (value: string) => {
    return PRIORITY_OPTIONS.find(p => p.value === value) || PRIORITY_OPTIONS[1];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Tasks</h2>
        <p className="text-gray-600">
          Define specific tasks that carers should complete during visits. These tasks will appear in the carer's visit workflow.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Care Tasks</h3>
            <Button type="button" onClick={addTask} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No tasks defined yet.</p>
              <p className="text-sm mt-1">Click "Add Task" to create tasks for carers to complete during visits.</p>
            </div>
          )}

          {tasks.map((_: any, index: number) => {
            const task = tasks[index];
            const priorityConfig = getPriorityConfig(task?.priority || "medium");

            return (
              <div key={index} className="border rounded-lg p-6 space-y-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-md font-medium">Task {index + 1}</h4>
                    {task?.category && (
                      <Badge variant="outline">{getCategoryLabel(task.category)}</Badge>
                    )}
                    {task?.priority && (
                      <Badge className={priorityConfig.color}>{priorityConfig.label}</Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeTask(index)}
                    size="sm"
                    variant="outline"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`tasks.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Check blood pressure" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`tasks.${index}.category`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "personal_care"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TASK_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`tasks.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide additional details or instructions..."
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
                    name={`tasks.${index}.priority`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "medium"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                    name={`tasks.${index}.time_of_day`}
                    render={({ field }) => {
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
              </div>
            );
          })}
        </div>
      </Form>
    </div>
  );
}
