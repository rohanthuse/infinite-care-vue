import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Activity } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WizardStepNews2MonitoringProps {
  form: UseFormReturn<any>;
}

export function WizardStepNews2Monitoring({ form }: WizardStepNews2MonitoringProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">NEWS2 Health Monitoring</h2>
        <p className="text-gray-600">
          Configure National Early Warning Score 2 (NEWS2) vital signs monitoring for this client.
        </p>
      </div>

      <Form {...form}>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              NEWS2 Health Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="news2_monitoring_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable NEWS2 Health Monitoring
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Monitor vital signs and calculate NEWS2 scores for this client
                    </div>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {form.watch("news2_monitoring_enabled") && (
              <div className="space-y-4 border-t pt-4">
                <FormField
                  control={form.control}
                  name="news2_monitoring_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monitoring Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || 'daily'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select monitoring frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="twice_daily">Twice Daily</SelectItem>
                          <SelectItem value="three_times_daily">Three Times Daily</SelectItem>
                          <SelectItem value="four_times_daily">Four Times Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="custom">Custom Schedule</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("news2_monitoring_frequency") === "custom" && (
                  <FormField
                    control={form.control}
                    name="news2_monitoring_custom_schedule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Schedule Details *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter custom monitoring schedule (e.g., 8am, 12pm, 4pm, 8pm)"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="news2_monitoring_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monitoring Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special instructions for NEWS2 monitoring..."
                          className="min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </Form>
    </div>
  );
}
