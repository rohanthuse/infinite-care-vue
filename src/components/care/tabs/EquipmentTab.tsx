import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Wrench, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { ClientEquipment } from "@/hooks/useClientData";

const EQUIPMENT_OPTIONS = [
  { label: "Electric Wheelchair", value: "electric-wheelchair" },
  { label: "Manual Wheelchair", value: "manual-wheelchair" },
  { label: "Walking frame", value: "walking-frame" },
  { label: "Tripod frame", value: "tripod-frame" },
  { label: "Wheeled walker", value: "wheeled-walker" },
  { label: "Walking stick", value: "walking-stick" },
  { label: "Hospital bed", value: "hospital-bed" },
  { label: "Rise recline Chair", value: "rise-recline-chair" },
  { label: "Bath lift", value: "bath-lift" },
  { label: "Shower seat", value: "shower-seat" },
  { label: "Static Commode", value: "static-commode" },
  { label: "Glider Commode", value: "glider-commode" },
  { label: "Ceiling track hoist", value: "ceiling-track-hoist" },
  { label: "Mobile hoist", value: "mobile-hoist" },
  { label: "Rotunda", value: "rotunda" },
  { label: "Standing hoist", value: "standing-hoist" },
  { label: "Stair lift", value: "stair-lift" },
  { label: "Perching stool", value: "perching-stool" },
  { label: "Raised toilet seat", value: "raised-toilet-seat" },
  { label: "Banana board", value: "banana-board" },
  { label: "Grab Rails", value: "grab-rails" },
  { label: "Other", value: "other" },
];

const formSchema = z.object({
  equipmentBlocks: z.array(z.object({
    equipmentUsed: z.array(z.string()).min(1, "Please select at least one equipment"),
    supplier: z.string().optional(),
    dateReceived: z.string().optional(),
    dateTrained: z.string().optional(),
    nextServiceDate: z.string().optional(),
    notes: z.string().optional(),
  }))
});

type FormData = z.infer<typeof formSchema>;

interface EquipmentTabProps {
  clientId: string;
  equipment: ClientEquipment[];
  onAddEquipment?: () => void;
}

export const EquipmentTab: React.FC<EquipmentTabProps> = ({
  clientId,
  equipment,
  onAddEquipment,
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      equipmentBlocks: [
        {
          equipmentUsed: [],
          supplier: "",
          dateReceived: "",
          dateTrained: "",
          nextServiceDate: "",
          notes: "",
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "equipmentBlocks",
  });

  const handleAddEquipmentBlock = () => {
    append({
      equipmentUsed: [],
      supplier: "",
      dateReceived: "",
      dateTrained: "",
      nextServiceDate: "",
      notes: "",
    });
  };

  const onSubmit = (data: FormData) => {
    console.log("Equipment data:", data);
    // Handle form submission here
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Equipment & Devices</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={handleAddEquipmentBlock}>
              <Plus className="h-4 w-4" />
              <span>Add Equipment Block</span>
            </Button>
          </div>
          <CardDescription>Client equipment and assistive devices</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-6 space-y-4 relative">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <FormField
                    control={form.control}
                    name={`equipmentBlocks.${index}.equipmentUsed`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Used</FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={EQUIPMENT_OPTIONS}
                            selected={field.value}
                            onSelectionChange={field.onChange}
                            placeholder="Select equipment..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`equipmentBlocks.${index}.supplier`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter supplier name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`equipmentBlocks.${index}.dateReceived`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Received</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`equipmentBlocks.${index}.dateTrained`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Trained</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`equipmentBlocks.${index}.nextServiceDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Service Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`equipmentBlocks.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter any additional notes about the equipment..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              <div className="flex gap-2">
                <Button type="submit">Save Equipment</Button>
                <Button type="button" variant="outline" onClick={handleAddEquipmentBlock}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Equipment Block
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
