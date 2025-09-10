import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MultiSelect } from "@/components/ui/multi-select";
import { useHobbies } from "@/data/hooks/useHobbies";

interface WizardStepHobbiesProps {
  form: UseFormReturn<any>;
}

export function WizardStepHobbies({ form }: WizardStepHobbiesProps) {
  const { data: hobbies = [], isLoading: hobbiesLoading } = useHobbies();

  const hobbiesOptions = hobbies.map((hobby) => ({
    value: hobby.id,
    label: hobby.title,
  }));

  if (hobbiesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <span className="ml-2">Loading hobbies...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hobbies & Interests</CardTitle>
          <CardDescription>
            Select the hobbies and interests that this client enjoys or would like to pursue.
            This information helps us understand their preferences and can guide activity planning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="hobbies.selected_hobbies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Hobbies</FormLabel>
                <MultiSelect
                  options={hobbiesOptions}
                  selected={field.value || []}
                  onSelectionChange={field.onChange}
                  placeholder="Choose hobbies..."
                  searchPlaceholder="Search hobbies..."
                  emptyText="No hobbies found."
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}