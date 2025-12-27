import React from "react";
import { UseFormReturn } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface WizardStep5AdminMedicationProps {
  form: UseFormReturn<any>;
}

export function WizardStep5AdminMedication({ form }: WizardStep5AdminMedicationProps) {
  // Watch form values for conditional rendering
  const takeMedication = form.watch("medical_info.admin_medication.take_medication");
  const useDosette = form.watch("medical_info.admin_medication.use_dosette_box");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Medication</h2>
        <p className="text-muted-foreground">
          Medication administration details and requirements.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Do you take medication */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.take_medication"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Do you take medication?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="take_med_yes" />
                      <Label htmlFor="take_med_yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="take_med_no" />
                      <Label htmlFor="take_med_no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Take medication details */}
          {takeMedication === "yes" && (
            <FormField
              control={form.control}
              name="medical_info.admin_medication.take_medication_details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Please provide details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about your medication..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Are you allergic to any medicine */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.allergic_to_medicine"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Are you allergic to any medicine?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="allergic_yes" />
                      <Label htmlFor="allergic_yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="allergic_no" />
                      <Label htmlFor="allergic_no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Do you need assistance with your medication */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.need_assistance"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Do you need assistance with your medication?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="assistance_yes" />
                      <Label htmlFor="assistance_yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="assistance_no" />
                      <Label htmlFor="assistance_no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Where do you store your medicines */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.medicine_storage_location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Where do you store your medicines?</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Kitchen cupboard, bedroom drawer..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Do you have a medicines box */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.have_medicines_box"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Do you have a medicines box?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="med_box_yes" />
                      <Label htmlFor="med_box_yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="med_box_no" />
                      <Label htmlFor="med_box_no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Who has access to your medicines */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.medicines_access"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Who has access to your medicines?</FormLabel>
                <div className="space-y-2">
                  {[
                    "Service user only",
                    "Family members",
                    "Care staff",
                    "Healthcare professionals",
                    "Others"
                  ].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`access_${option.replace(/\s+/g, '_').toLowerCase()}`}
                        checked={field.value?.includes(option) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...(field.value || []), option]);
                          } else {
                            field.onChange((field.value || []).filter((item: string) => item !== option));
                          }
                        }}
                      />
                      <Label htmlFor={`access_${option.replace(/\s+/g, '_').toLowerCase()}`}>
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Do you use a dosette box */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.use_dosette_box"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Do you use a dosette box?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="dosette_yes" />
                      <Label htmlFor="dosette_yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="dosette_no" />
                      <Label htmlFor="dosette_no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dosette box details */}
          {useDosette === "yes" && (
            <FormField
              control={form.control}
              name="medical_info.admin_medication.dosette_box_details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Please provide details about your dosette box</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Weekly dosette box, filled by pharmacy..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Do you take medication outside of your dosette box */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.medication_outside_dosette"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Do you take medication outside of your dosette box?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="outside_dosette_yes" />
                      <Label htmlFor="outside_dosette_yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="outside_dosette_no" />
                      <Label htmlFor="outside_dosette_no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Administration methods */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.administration_methods"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Administration methods (select all that apply)</FormLabel>
                <div className="space-y-2">
                  {[
                    "Oral (tablets/capsules)",
                    "Liquid medicine",
                    "Injections",
                    "Inhalers",
                    "Eye drops",
                    "Topical creams/ointments",
                    "Patches",
                    "Suppositories"
                  ].map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox
                        id={`method_${method.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`}
                        checked={field.value?.includes(method) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...(field.value || []), method]);
                          } else {
                            field.onChange((field.value || []).filter((item: string) => item !== method));
                          }
                        }}
                      />
                      <Label htmlFor={`method_${method.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`}>
                        {method}
                      </Label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Do you require help with inhalers */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.help_required_inhalers"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Do you require help with inhalers?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="help_inhalers_yes" />
                      <Label htmlFor="help_inhalers_yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="help_inhalers_no" />
                      <Label htmlFor="help_inhalers_no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Do you require help with eye drops */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.help_required_eye_drops"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Do you require help with eye drops?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="help_eye_drops_yes" />
                      <Label htmlFor="help_eye_drops_yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="help_eye_drops_no" />
                      <Label htmlFor="help_eye_drops_no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Do you require help with creams */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.help_required_creams"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Do you require help with creams?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="help_creams_yes" />
                      <Label htmlFor="help_creams_yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="help_creams_no" />
                      <Label htmlFor="help_creams_no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Do you use pain patches */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.use_pain_patches"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Do you use pain patches?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="pain_patches_yes" />
                      <Label htmlFor="pain_patches_yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="pain_patches_no" />
                      <Label htmlFor="pain_patches_no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Who is your medication prescribed by */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.prescribed_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Who is your medication prescribed by? (select all that apply)</FormLabel>
                <div className="space-y-2">
                  {[
                    "GP (General Practitioner)",
                    "Hospital consultant",
                    "Psychiatrist",
                    "Nurse practitioner",
                    "Specialist doctor",
                    "Others"
                  ].map((prescriber) => (
                    <div key={prescriber} className="flex items-center space-x-2">
                      <Checkbox
                        id={`prescribed_${prescriber.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`}
                        checked={field.value?.includes(prescriber) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...(field.value || []), prescriber]);
                          } else {
                            field.onChange((field.value || []).filter((item: string) => item !== prescriber));
                          }
                        }}
                      />
                      <Label htmlFor={`prescribed_${prescriber.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`}>
                        {prescriber}
                      </Label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* How often do you get repeat prescriptions */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.repeat_prescription_frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How often do you get repeat prescriptions?</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="fortnightly">Fortnightly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="every_2_months">Every 2 months</SelectItem>
                    <SelectItem value="every_3_months">Every 3 months</SelectItem>
                    <SelectItem value="as_needed">As needed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* How do you order your prescriptions */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.prescription_order_methods"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How do you order your prescriptions? (select all that apply)</FormLabel>
                <div className="space-y-2">
                  {[
                    "Online (NHS app/website)",
                    "Phone call to GP surgery",
                    "Visit GP surgery in person",
                    "Pharmacy collection slip",
                    "Family member/carer orders",
                    "Automatic repeat service",
                    "Others"
                  ].map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox
                        id={`order_${method.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`}
                        checked={field.value?.includes(method) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...(field.value || []), method]);
                          } else {
                            field.onChange((field.value || []).filter((item: string) => item !== method));
                          }
                        }}
                      />
                      <Label htmlFor={`order_${method.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`}>
                        {method}
                      </Label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Extra information */}
          <FormField
            control={form.control}
            name="medical_info.admin_medication.extra_information"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Extra Information</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Please provide any additional information about your medication needs..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  );
}