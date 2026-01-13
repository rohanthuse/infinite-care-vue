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
import { EQUIPMENT_OPTIONS, HANDLING_FACTORS, ENVIRONMENT_CHECKS, HOME_REPAIR_OPTIONS } from "@/constants/equipment";

interface WizardStep10EquipmentProps {
  form: UseFormReturn<any>;
}

export function WizardStep10Equipment({ form }: WizardStep10EquipmentProps) {
  // Migrate legacy data on component mount
  useEffect(() => {
    const equipment = form.getValues("equipment");
    
    // Handle legacy array format
    if (Array.isArray(equipment)) {
      const hasLegacyData = equipment.some((item: any) => item.equipment_name || item.equipment_type);
      
      if (hasLegacyData) {
        console.log("Migrating legacy equipment array format");
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
            equipmentUsed: equipmentUsed[0] || "",
            handlingFactors: [],
            remedialAction: allNotes,
            hasExpiryDate: item.next_maintenance_date ? "yes" : "no",
            maintenanceExpiryDate: item.next_maintenance_date || "",
          };
        });
        
        form.setValue("equipment.equipment_blocks", transformedEquipment);
      }
    } else if (equipment?.equipment_blocks && Array.isArray(equipment.equipment_blocks)) {
      // Handle object format with legacy equipment_blocks
      const hasLegacyData = equipment.equipment_blocks.some((item: any) => item.equipment_name || item.equipment_type);
      
      if (hasLegacyData) {
        console.log("Migrating legacy equipment blocks within object format");
        const transformedEquipment = equipment.equipment_blocks.map((item: any) => {
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
            equipmentUsed: equipmentUsed[0] || "",
            handlingFactors: [],
            remedialAction: allNotes,
            hasExpiryDate: item.next_maintenance_date ? "yes" : "no",
            maintenanceExpiryDate: item.next_maintenance_date || "",
          };
        });
        
        form.setValue("equipment.equipment_blocks", transformedEquipment);
      }
    }

    // Migrate legacy environment checks
    if (equipment?.environment_checks) {
      const envChecks = equipment.environment_checks;
      const hasLegacyEnvData = 
        envChecks.adequate_space !== undefined ||
        envChecks.stairs_steps !== undefined ||
        envChecks.loose_rugs !== undefined ||
        envChecks.trailing_leads !== undefined ||
        envChecks.slippery_surfaces !== undefined ||
        envChecks.pets !== undefined ||
        envChecks.clutter_obstacles !== undefined ||
        envChecks.narrow_doorways !== undefined ||
        envChecks.low_furniture !== undefined ||
        envChecks.other_hazards !== undefined;

      if (hasLegacyEnvData) {
        console.log("Migrating legacy environment checks");
        const migratedEnvChecks = {
          // Map legacy fields to new fields where appropriate
          adequate_lighting: envChecks.appropriate_lighting,
          space_constraints: envChecks.adequate_space,
          trip_hazards: envChecks.loose_rugs || envChecks.slippery_surfaces || envChecks.clutter_obstacles,
          variation_in_levels: envChecks.stairs_steps,
          narrow_passages: envChecks.narrow_doorways,
          heavy_doors: undefined, // New field, no legacy equivalent
          floor_surfaces: envChecks.slippery_surfaces,
          pets_present: envChecks.pets,
          other_people_present: undefined, // New field, no legacy equivalent
          temperature_considerations: undefined, // New field, no legacy equivalent
          other_considerations: envChecks.other_hazards,
          // Preserve any existing new format data
          ...Object.fromEntries(
            Object.entries(envChecks).filter(([key]) => 
              ['adequate_lighting', 'space_constraints', 'trip_hazards', 'variation_in_levels', 
               'narrow_passages', 'heavy_doors', 'floor_surfaces', 'pets_present', 
               'other_people_present', 'temperature_considerations', 'other_considerations'].includes(key)
            )
          )
        };
        
        form.setValue("equipment.environment_checks", migratedEnvChecks);
      }
    }
  }, [form]);

  const addEquipmentBlock = () => {
    const current = form.getValues("equipment.equipment_blocks") || [];
    form.setValue("equipment.equipment_blocks", [...current, {
      equipmentUsed: "",
      handlingFactors: [],
      remedialAction: "",
      hasExpiryDate: "no",
      maintenanceExpiryDate: "",
    }]);
  };

  const removeEquipmentBlock = (index: number) => {
    const current = form.getValues("equipment.equipment_blocks") || [];
    form.setValue("equipment.equipment_blocks", current.filter((_, i) => i !== index));
  };

  const rawEquipment = form.watch("equipment.equipment_blocks");
  const equipment = Array.isArray(rawEquipment) ? rawEquipment : [];

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
                {/* Equipment Used - Single Select Dropdown */}
                <FormField
                  control={form.control}
                  name={`equipment.equipment_blocks.${index}.equipmentUsed`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Used <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Combobox
                          options={EQUIPMENT_OPTIONS}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Select equipment..."
                          searchPlaceholder="Search equipment..."
                          emptyText="No equipment found."
                          allowCustom={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Factors to be Considered - Multi-select Tags */}
                <FormField
                  control={form.control}
                  name={`equipment.equipment_blocks.${index}.handlingFactors`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Factors to be considered when moving and handling Client</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={HANDLING_FACTORS}
                          selected={field.value || []}
                          onSelectionChange={field.onChange}
                          placeholder="Select factors..."
                          searchPlaceholder="Search factors..."
                          emptyText="No factors found."
                          maxDisplay={5}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Possible Remedial Action - Textarea */}
                <FormField
                  control={form.control}
                  name={`equipment.equipment_blocks.${index}.remedialAction`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Possible Remedial Action?</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., Use of side rails and brakes, Ensure regular servicing checks are current and up to date"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Has an Expiry Date - Radio Buttons */}
                <FormField
                  control={form.control}
                  name={`equipment.equipment_blocks.${index}.hasExpiryDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Has an expiry date?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value || "no"}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id={`expiry-${index}-yes`} />
                            <label 
                              htmlFor={`expiry-${index}-yes`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              Yes
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`expiry-${index}-no`} />
                            <label 
                              htmlFor={`expiry-${index}-no`}
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

                {/* Maintenance Expiry Date - Conditional on "Yes" */}
                {form.watch(`equipment.equipment_blocks.${index}.hasExpiryDate`) === "yes" && (
                  <FormField
                    control={form.control}
                    name={`equipment.equipment_blocks.${index}.maintenanceExpiryDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maintenance Expiry Date <span className="text-red-500">*</span></FormLabel>
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
                )}
              </div>
            </div>
          ))}

          {/* Moving & Handling of the Client */}
          <div className="border rounded-lg p-6 space-y-4 bg-blue-50">
            <h4 className="text-md font-medium">Moving & Handling of the Client</h4>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="equipment.moving_handling.how_to_transfer_client"
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
                name="equipment.moving_handling.area_preparation_needed"
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
                name="equipment.moving_handling.type_of_equipment_required"
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
                    <FormLabel>Who manages my home repairs?</FormLabel>
                    <FormControl>
                      <div className="relative z-50">
                        <Combobox
                          options={HOME_REPAIR_OPTIONS}
                          value={field.value || ""}
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Clear contact fields if "My Family" is selected
                            if (value === "my_family") {
                              form.setValue("equipment.home_repairs.contact_name", "");
                              form.setValue("equipment.home_repairs.contact_telephone", "");
                            }
                          }}
                          placeholder="Select who manages repairs..."
                          searchPlaceholder="Search options..."
                          emptyText="No options found."
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

              {form.watch("equipment.home_repairs.repair_needed") && form.watch("equipment.home_repairs.repair_needed") !== "my_family" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="equipment.home_repairs.contact_name"
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
                    name="equipment.home_repairs.contact_telephone"
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
          </div>
        </div>
      </Form>
    </div>
  );
}