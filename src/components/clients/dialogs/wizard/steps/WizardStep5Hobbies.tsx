import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { MultiSelect } from "@/components/ui/multi-select";
import { useHobbies } from "@/data/hooks/useHobbies";
import { Loader2 } from "lucide-react";

interface WizardStep5HobbiesProps {
  form: UseFormReturn<any>;
}

export function WizardStep5Hobbies({ form }: WizardStep5HobbiesProps) {
  const { data: hobbies = [], isLoading, error } = useHobbies();

  const hobbiesOptions = hobbies.map((hobby) => ({
    value: hobby.id,
    label: hobby.title,
  }));

  const selectedHobbies = form.watch("hobbies.selected_hobbies") || [];

  const handleSelectionChange = (selected: string[]) => {
    form.setValue("hobbies.selected_hobbies", selected);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading hobbies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <p>Failed to load hobbies. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Hobbies</h3>
        <p className="text-muted-foreground mb-6">
          Select the hobbies that the client enjoys or is interested in pursuing.
        </p>
      </div>

      <FormField
        control={form.control}
        name="hobbies.selected_hobbies"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Hobbies</FormLabel>
            <FormControl>
              <MultiSelect
                options={hobbiesOptions}
                selected={selectedHobbies}
                onSelectionChange={handleSelectionChange}
                placeholder="Choose hobbies..."
                searchPlaceholder="Search hobbies..."
                emptyText="No hobbies found."
                maxDisplay={5}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}