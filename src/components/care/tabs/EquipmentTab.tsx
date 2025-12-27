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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { EQUIPMENT_OPTIONS, ENVIRONMENT_CHECKS, HOME_REPAIR_OPTIONS } from "@/constants/equipment";
import { ClientEquipment } from "@/hooks/useClientData";

const formSchema = z.object({
  equipmentRows: z.array(z.object({
    equipmentUsed: z.string().min(1, "Please select equipment"),
    factorsToConsider: z.string().optional(),
    remedialAction: z.string().optional(),
    hasExpiryDate: z.string().optional(),
  })),
  // Moving & Handling section
  movingHandling: z.object({
    howToTransferClient: z.string().optional(),
    areaPreparationNeeded: z.string().optional(),
    typeOfEquipmentRequired: z.string().optional(),
  }),
  // Environment Checks section
  environmentChecks: z.object({
    adequate_lighting: z.string().optional(),
    space_constraints: z.string().optional(),
    trip_hazards: z.string().optional(),
    variation_in_levels: z.string().optional(),
    narrow_passages: z.string().optional(),
    heavy_doors: z.string().optional(),
    floor_surfaces: z.string().optional(),
    pets_present: z.string().optional(),
    other_people_present: z.string().optional(),
    temperature_considerations: z.string().optional(),
    other_considerations: z.string().optional(),
  }),
  // Home Repairs section
  homeRepairs: z.object({
    repairType: z.string().optional(),
    otherRepair: z.string().optional(),
    contactName: z.string().optional(),
    contactTelephone: z.string().optional(),
  }),
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
      equipmentRows: [
        {
          equipmentUsed: "",
          factorsToConsider: "",
          remedialAction: "",
          hasExpiryDate: "",
        }
      ],
      movingHandling: {
        howToTransferClient: "",
        areaPreparationNeeded: "",
        typeOfEquipmentRequired: "",
      },
      environmentChecks: {
        adequate_lighting: "",
        space_constraints: "",
        trip_hazards: "",
        variation_in_levels: "",
        narrow_passages: "",
        heavy_doors: "",
        floor_surfaces: "",
        pets_present: "",
        other_people_present: "",
        temperature_considerations: "",
        other_considerations: "",
      },
      homeRepairs: {
        repairType: "",
        otherRepair: "",
        contactName: "",
        contactTelephone: "",
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "equipmentRows",
  });

  const handleAddRow = () => {
    append({
      equipmentUsed: "",
      factorsToConsider: "",
      remedialAction: "",
      hasExpiryDate: "",
    });
  };

  const onSubmit = (data: FormData) => {
    console.log("Equipment data:", data);
    // Handle form submission here
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/30 dark:to-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Equipment & Devices</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={handleAddRow}>
              <Plus className="h-4 w-4" />
              <span>Add</span>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`equipmentRows.${index}.equipmentUsed`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment Used</FormLabel>
                          <FormControl>
                            <Combobox
                              options={EQUIPMENT_OPTIONS}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select equipment..."
                              searchPlaceholder="Search equipment..."
                              emptyText="No equipment found."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`equipmentRows.${index}.factorsToConsider`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Factors to be considered when moving and handling Client</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter factors to consider..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`equipmentRows.${index}.remedialAction`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Possible Remedial Action?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter possible remedial actions..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`equipmentRows.${index}.hasExpiryDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Has an expiry date?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex flex-row space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`yes-${index}`} />
                              <Label htmlFor={`yes-${index}`}>Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`no-${index}`} />
                              <Label htmlFor={`no-${index}`}>No</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              <div className="flex gap-2">
                <Button type="submit">Save Equipment</Button>
                <Button type="button" variant="outline" onClick={handleAddRow}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Row
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Moving & Handling Section */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
          <CardTitle className="text-lg">Moving & Handling of the Client</CardTitle>
          <CardDescription>Client handling considerations and techniques</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="movingHandling.howToTransferClient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How to transfer Client?</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter how to transfer the client..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="movingHandling.areaPreparationNeeded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Does area needs to be prepared?</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter area preparation requirements..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="movingHandling.typeOfEquipmentRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of equipment required?</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter type of equipment required..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Environment Checks Section */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white dark:from-green-950/30 dark:to-background">
          <CardTitle className="text-lg">Environment Checks</CardTitle>
          <CardDescription>Assessment of environmental factors affecting client safety</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ENVIRONMENT_CHECKS.map((check) => (
                <FormField
                  key={check.key}
                  control={form.control}
                  name={`environmentChecks.${check.key}` as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{check.label}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex flex-row space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id={`${check.key}-yes`} />
                            <Label htmlFor={`${check.key}-yes`}>Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`${check.key}-no`} />
                            <Label htmlFor={`${check.key}-no`}>No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Home Repairs Section */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/30 dark:to-background">
          <CardTitle className="text-lg">Home Repairs</CardTitle>
          <CardDescription>Recommended home modifications and repairs</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Form {...form}>
            <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="homeRepairs.repairType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Who manages my home repairs?</FormLabel>
                      <FormControl>
                        <Combobox
                          options={HOME_REPAIR_OPTIONS}
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Clear contact fields if "My Family" is selected
                            if (value === "my_family") {
                              form.setValue("homeRepairs.contactName", "");
                              form.setValue("homeRepairs.contactTelephone", "");
                            }
                          }}
                          placeholder="Select who manages repairs..."
                          searchPlaceholder="Search options..."
                          emptyText="No options found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("homeRepairs.repairType") === "other" && (
                  <FormField
                    control={form.control}
                    name="homeRepairs.otherRepair"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Please specify other</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter other details..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("homeRepairs.repairType") && form.watch("homeRepairs.repairType") !== "my_family" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="homeRepairs.contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter contact name..."
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="homeRepairs.contactTelephone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telephone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter telephone number..."
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
