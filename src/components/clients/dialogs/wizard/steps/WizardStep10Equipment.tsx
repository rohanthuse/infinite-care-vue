
import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, Trash2, Calendar } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { MultiSelect } from "@/components/ui/multi-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Combobox } from "@/components/ui/combobox";
import { EQUIPMENT_OPTIONS, ENVIRONMENT_CHECKS, HOME_REPAIR_OPTIONS } from "@/constants/equipment";

interface WizardStep10EquipmentProps {
  form: UseFormReturn<any>;
}

export function WizardStep10Equipment({ form }: WizardStep10EquipmentProps) {
  // Migrate legacy data on component mount
  useEffect(() => {
    const equipment = form.getValues("equipment") || [];
    const hasLegacyData = equipment.some((item: any) => item.equipment_name || item.equipment_type);
    
    if (hasLegacyData) {
      const transformedEquipment = equipment.map((item: any) => {
        // If it's already in new format, return as is
        if (item.equipmentUsed && !item.equipment_name) {
          return item;
        }
        
        // Transform legacy format to new format
        const equipmentUsed = [];
        if (item.equipment_name) {
          // Try to match equipment_name to an option
          const matchedOption = EQUIPMENT_OPTIONS.find(opt => 
            opt.label.toLowerCase().includes(item.equipment_name.toLowerCase()) ||
            item.equipment_name.toLowerCase().includes(opt.label.toLowerCase())
          );
          if (matchedOption) {
            equipmentUsed.push(matchedOption.value);
          }
        }
        
        // Preserve all legacy information in notes
        const legacyInfo = [];
        if (item.equipment_name && !equipmentUsed.length) legacyInfo.push(`Equipment: ${item.equipment_name}`);
        if (item.equipment_type) legacyInfo.push(`Type: ${item.equipment_type}`);
        if (item.manufacturer) legacyInfo.push(`Manufacturer: ${item.manufacturer}`);
        if (item.model_number) legacyInfo.push(`Model: ${item.model_number}`);
        if (item.serial_number) legacyInfo.push(`Serial: ${item.serial_number}`);
        if (item.location) legacyInfo.push(`Location: ${item.location}`);
        if (item.maintenance_schedule) legacyInfo.push(`Maintenance: ${item.maintenance_schedule}`);
        
        const existingNotes = item.notes || "";
        const allNotes = [existingNotes, ...legacyInfo].filter(Boolean).join('\n');
        
        return {
          equipmentUsed,
          supplier: "",
          dateReceived: item.installation_date || "",
          dateTrained: "",
          nextServiceDate: item.next_maintenance_date || "",
          notes: allNotes
        };
      });
      
      form.setValue("equipment.equipment_blocks", transformedEquipment);
    }
  }, [form]);

  const addEquipmentBlock = () => {
    const current = form.getValues("equipment.equipment_blocks") || [];
    form.setValue("equipment.equipment_blocks", [...current, {
      equipmentUsed: [],
      supplier: "",
      dateReceived: "",
      dateTrained: "",
      nextServiceDate: "",
      notes: ""
    }]);
  };

  const removeEquipmentBlock = (index: number) => {
    const current = form.getValues("equipment.equipment_blocks") || [];
    form.setValue("equipment.equipment_blocks", current.filter((_, i) => i !== index));
  };

  const equipment = form.watch("equipment.equipment_blocks") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Equipment</h2>
        <p className="text-gray-600">
          Equipment and assistive devices used by the client.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Equipment Blocks</h3>
            <Button type="button" onClick={addEquipmentBlock} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Equipment Block
            </Button>
          </div>

          {equipment.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <p>No equipment blocks added yet. Click "Add Equipment Block" to get started.</p>
            </div>
          )}

          {equipment.map((_, index) => (
            <div key={index} className="border rounded-lg p-6 space-y-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium">Equipment Block {index + 1}</h4>
                {equipment.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeEquipmentBlock(index)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name={`equipment.equipment_blocks.${index}.equipmentUsed`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Used</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={EQUIPMENT_OPTIONS}
                          selected={field.value || []}
                          onSelectionChange={field.onChange}
                          placeholder="Select equipment..."
                          searchPlaceholder="Search equipment..."
                          emptyText="No equipment found."
                          maxDisplay={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`equipment.equipment_blocks.${index}.supplier`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter supplier name" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`equipment.equipment_blocks.${index}.dateReceived`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Received</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`equipment.equipment_blocks.${index}.dateTrained`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Trained</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`equipment.equipment_blocks.${index}.nextServiceDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next Service Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
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
                  name={`equipment.equipment_blocks.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes about the equipment..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}

          {/* Moving & Handling of the Client */}
          <div className="border rounded-lg p-6 space-y-4 bg-blue-50">
            <h4 className="text-md font-medium">Moving & Handling of the Client</h4>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="equipment.moving_handling.facilitation_independence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facilitation of Independence</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter details about facilitation of independence..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="equipment.moving_handling.manual_handling_considerations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manual Handling Considerations</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter manual handling considerations..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="equipment.moving_handling.moving_handling_advice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moving & Handling Advice</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter moving and handling advice..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Environment Checks */}
          <div className="border rounded-lg p-6 space-y-4 bg-green-50">
            <h4 className="text-md font-medium">Environment Checks</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ENVIRONMENT_CHECKS.map((check) => (
                <FormField
                  key={check.key}
                  control={form.control}
                  name={`equipment.environment_checks.${check.key}`}
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium">{check.label}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id={`${check.key}-yes`} />
                            <label 
                              htmlFor={`${check.key}-yes`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              Yes
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`${check.key}-no`} />
                            <label 
                              htmlFor={`${check.key}-no`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              No
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Home Repairs */}
          <div className="border rounded-lg p-6 space-y-4 bg-yellow-50">
            <h4 className="text-md font-medium">Home Repairs</h4>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="equipment.home_repairs.repair_needed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What repair is needed?</FormLabel>
                    <FormControl>
                      <div className="relative z-50">
                        <Combobox
                          options={HOME_REPAIR_OPTIONS}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Select repair type..."
                          searchPlaceholder="Search repairs..."
                          emptyText="No repairs found."
                          allowCustom={false}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("equipment.home_repairs.repair_needed") === "other" && (
                <FormField
                  control={form.control}
                  name="equipment.home_repairs.repair_other"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please specify other repair</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter other repair details..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
