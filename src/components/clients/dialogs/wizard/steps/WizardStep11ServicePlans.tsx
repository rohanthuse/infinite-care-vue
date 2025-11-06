
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Calendar } from "lucide-react";
import { format } from "date-fns";
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

interface WizardStep11ServicePlansProps {
  form: UseFormReturn<any>;
}

export function WizardStep11ServicePlans({ form }: WizardStep11ServicePlansProps) {
  const addServicePlan = () => {
    const current = form.getValues("service_plans") || [];
    form.setValue("service_plans", [...current, {
      service_name: "",
      service_category: "",
      provider_name: "",
      start_date: null,
      end_date: null,
      frequency: "",
      duration: "",
      goals: [],
      notes: ""
    }]);
  };

  const removeServicePlan = (index: number) => {
    const current = form.getValues("service_plans") || [];
    form.setValue("service_plans", current.filter((_, i) => i !== index));
  };

  const addGoal = (planIndex: number) => {
    const current = form.getValues(`service_plans.${planIndex}.goals`) || [];
    form.setValue(`service_plans.${planIndex}.goals`, [...current, ""]);
  };

  const removeGoal = (planIndex: number, goalIndex: number) => {
    const current = form.getValues(`service_plans.${planIndex}.goals`) || [];
    form.setValue(`service_plans.${planIndex}.goals`, current.filter((_, i) => i !== goalIndex));
  };

  const servicePlans = form.watch("service_plans") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Service Plans</h2>
        <p className="text-gray-600">
          Overall care coordination and service planning for comprehensive care delivery.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Service Plans</h3>
            <Button type="button" onClick={addServicePlan} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Service Plan
            </Button>
          </div>

          {servicePlans.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <p>No service plans added yet. Click "Add Service Plan" to create your first plan.</p>
            </div>
          )}

          {servicePlans.map((_, index) => (
            <div key={index} className="border rounded-lg p-6 space-y-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium">Service Plan {index + 1}</h4>
                <Button
                  type="button"
                  onClick={() => removeServicePlan(index)}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`service_plans.${index}.service_name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Personal care, Physiotherapy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`service_plans.${index}.service_category`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="personal_care">Personal Care</SelectItem>
                          <SelectItem value="medical_care">Medical Care</SelectItem>
                          <SelectItem value="therapy">Therapy</SelectItem>
                          <SelectItem value="social_support">Social Support</SelectItem>
                          <SelectItem value="domestic_support">Domestic Support</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`service_plans.${index}.provider_name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter provider or organisation name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`service_plans.${index}.frequency`}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`service_plans.${index}.start_date`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
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
                                <span>Pick date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
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
                  name={`service_plans.${index}.end_date`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
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
                                <span>Pick date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
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
                  name={`service_plans.${index}.duration`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2 hours, 30 minutes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Goals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Service Goals</FormLabel>
                  <Button 
                    type="button" 
                    onClick={() => addGoal(index)} 
                    size="sm" 
                    variant="outline"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Goal
                  </Button>
                </div>
                {(form.watch(`service_plans.${index}.goals`) || []).map((_, goalIndex) => (
                  <div key={goalIndex} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`service_plans.${index}.goals.${goalIndex}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Enter service goal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      onClick={() => removeGoal(index, goalIndex)}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <FormField
                control={form.control}
                name={`service_plans.${index}.notes`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes about this service plan..."
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
