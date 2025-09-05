
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  personal_hygiene_needs: z.string().optional(),
  bathing_preferences: z.string().optional(),
  dressing_assistance_level: z.string().optional(),
  toileting_assistance_level: z.string().optional(),
  continence_status: z.string().optional(),
  sleep_patterns: z.string().optional(),
  behavioral_notes: z.string().optional(),
  comfort_measures: z.string().optional(),
  pain_management: z.string().optional(),
  skin_care_needs: z.string().optional(),
  // Incontinence section
  incontinence_products_required: z.boolean().optional(),
  // Sleep section
  sleep_go_to_bed_time: z.string().optional(),
  sleep_wake_up_time: z.string().optional(),
  sleep_get_out_of_bed_time: z.string().optional(),
  sleep_prepare_duration: z.string().optional(),
  assist_going_to_bed: z.boolean().optional(),
  assist_getting_out_of_bed: z.boolean().optional(),
  panic_button_in_bed: z.boolean().optional(),
  assist_turn_to_sleep_position: z.boolean().optional(),
  // Washing, Showering, Bathing fields
  washing_showering_bathing_assistance_level: z.string().optional(),
  washing_showering_bathing_notes: z.string().optional(),
  wash_hands_face_independently: z.boolean().optional(),
  wash_body_independently: z.boolean().optional(),
  get_in_out_bath_shower_independently: z.boolean().optional(),
  dry_self_independently: z.boolean().optional(),
  prefer_bath_or_shower: z.string().optional(),
  bathing_frequency: z.string().optional(),
  specific_washing_requirements: z.string().optional(),
  skin_condition_considerations: z.string().optional(),
  mobility_aids_for_bathing: z.string().optional(),
  bathroom_safety_concerns: z.string().optional(),
});

interface EditPersonalCareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  personalCare?: any;
  isLoading?: boolean;
}

export const EditPersonalCareDialog: React.FC<EditPersonalCareDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  personalCare,
  isLoading = false,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personal_hygiene_needs: personalCare?.personal_hygiene_needs || "",
      bathing_preferences: personalCare?.bathing_preferences || "",
      dressing_assistance_level: personalCare?.dressing_assistance_level || "",
      toileting_assistance_level: personalCare?.toileting_assistance_level || "",
      continence_status: personalCare?.continence_status || "",
      sleep_patterns: personalCare?.sleep_patterns || "",
      behavioral_notes: personalCare?.behavioral_notes || "",
      comfort_measures: personalCare?.comfort_measures || "",
      pain_management: personalCare?.pain_management || "",
      skin_care_needs: personalCare?.skin_care_needs || "",
      // Incontinence section
      incontinence_products_required: personalCare?.incontinence_products_required || false,
      // Sleep section
      sleep_go_to_bed_time: personalCare?.sleep_go_to_bed_time || "",
      sleep_wake_up_time: personalCare?.sleep_wake_up_time || "",
      sleep_get_out_of_bed_time: personalCare?.sleep_get_out_of_bed_time || "",
      sleep_prepare_duration: personalCare?.sleep_prepare_duration || "",
      assist_going_to_bed: personalCare?.assist_going_to_bed || false,
    assist_getting_out_of_bed: personalCare?.assist_getting_out_of_bed || false,
    panic_button_in_bed: personalCare?.panic_button_in_bed || false,
    assist_turn_to_sleep_position: personalCare?.assist_turn_to_sleep_position || false,
    // Washing, Showering, Bathing defaults
    washing_showering_bathing_assistance_level: personalCare?.washing_showering_bathing_assistance_level || "",
    washing_showering_bathing_notes: personalCare?.washing_showering_bathing_notes || "",
    wash_hands_face_independently: personalCare?.wash_hands_face_independently || false,
    wash_body_independently: personalCare?.wash_body_independently || false,
    get_in_out_bath_shower_independently: personalCare?.get_in_out_bath_shower_independently || false,
    dry_self_independently: personalCare?.dry_self_independently || false,
    prefer_bath_or_shower: personalCare?.prefer_bath_or_shower || "",
    bathing_frequency: personalCare?.bathing_frequency || "",
    specific_washing_requirements: personalCare?.specific_washing_requirements || "",
    skin_condition_considerations: personalCare?.skin_condition_considerations || "",
    mobility_aids_for_bathing: personalCare?.mobility_aids_for_bathing || "",
    bathroom_safety_concerns: personalCare?.bathroom_safety_concerns || "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
    form.reset();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Personal Care Plan</DialogTitle>
          <DialogDescription>
            Update personal care requirements and daily care routines for this client.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Personal Hygiene Needs */}
            <FormField
              control={form.control}
              name="personal_hygiene_needs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Hygiene Needs</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe specific personal hygiene requirements..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bathing Preferences */}
            <FormField
              control={form.control}
              name="bathing_preferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bathing Preferences</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe bathing preferences and requirements..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dressing Assistance Level */}
              <FormField
                control={form.control}
                name="dressing_assistance_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dressing Assistance Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assistance level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="independent">Independent</SelectItem>
                        <SelectItem value="minimal">Minimal Assistance</SelectItem>
                        <SelectItem value="moderate">Moderate Assistance</SelectItem>
                        <SelectItem value="full">Full Assistance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Toileting Assistance Level */}
              <FormField
                control={form.control}
                name="toileting_assistance_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Toileting Assistance Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assistance level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="independent">Independent</SelectItem>
                        <SelectItem value="minimal">Minimal Assistance</SelectItem>
                        <SelectItem value="moderate">Moderate Assistance</SelectItem>
                        <SelectItem value="full">Full Assistance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Continence Status */}
            <FormField
              control={form.control}
              name="continence_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Continence Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select continence status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="continent">Continent</SelectItem>
                      <SelectItem value="incontinent">Incontinent</SelectItem>
                      <SelectItem value="catheter">Catheter</SelectItem>
                      <SelectItem value="stoma">Stoma</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sleep Patterns */}
            <FormField
              control={form.control}
              name="sleep_patterns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sleep Patterns</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe sleep patterns and requirements..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Behavioral Notes */}
            <FormField
              control={form.control}
              name="behavioral_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Behavioral Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe behavioral considerations and management strategies..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comfort Measures */}
            <FormField
              control={form.control}
              name="comfort_measures"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comfort Measures</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe comfort measures and preferences..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pain Management */}
            <FormField
              control={form.control}
              name="pain_management"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pain Management</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe pain management strategies and requirements..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Skin Care Needs */}
            <FormField
              control={form.control}
              name="skin_care_needs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skin Care Needs</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe skin care needs and requirements..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Incontinence Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Incontinence</h3>
              <FormField
                control={form.control}
                name="incontinence_products_required"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Are incontinence products required?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value === true ? 'yes' : field.value === false ? 'no' : ''}
                        onValueChange={(value) => field.onChange(value === 'yes')}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="incontinence-yes" />
                          <Label htmlFor="incontinence-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="incontinence-no" />
                          <Label htmlFor="incontinence-no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sleep Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Sleep</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="sleep_go_to_bed_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What time do you usually go to bed?</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          placeholder="e.g., 22:00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sleep_wake_up_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What time do you usually wake up?</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          placeholder="e.g., 07:00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sleep_get_out_of_bed_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What time do you prefer to get out of bed?</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          placeholder="e.g., 08:00"
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
                name="sleep_prepare_duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How long will it take you to prepare to go to bed?</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 30 minutes, 1 hour"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="assist_going_to_bed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you want us to assist you with going to bed?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? 'yes' : field.value === false ? 'no' : ''}
                          onValueChange={(value) => field.onChange(value === 'yes')}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="assist-bed-yes" />
                            <Label htmlFor="assist-bed-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="assist-bed-no" />
                            <Label htmlFor="assist-bed-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assist_getting_out_of_bed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you want us to assist you with getting out of the bed?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? 'yes' : field.value === false ? 'no' : ''}
                          onValueChange={(value) => field.onChange(value === 'yes')}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="assist-out-yes" />
                            <Label htmlFor="assist-out-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="assist-out-no" />
                            <Label htmlFor="assist-out-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="panic_button_in_bed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you have a panic button to call for assistance when in bed?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? 'yes' : field.value === false ? 'no' : ''}
                          onValueChange={(value) => field.onChange(value === 'yes')}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="panic-button-yes" />
                            <Label htmlFor="panic-button-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="panic-button-no" />
                            <Label htmlFor="panic-button-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assist_turn_to_sleep_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you need assistance to turn to your preferred sleeping position at night?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value === true ? 'yes' : field.value === false ? 'no' : ''}
                          onValueChange={(value) => field.onChange(value === 'yes')}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="assist-turn-yes" />
                            <Label htmlFor="assist-turn-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="assist-turn-no" />
                            <Label htmlFor="assist-turn-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Washing, Showering, Bathing Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Washing, Showering, Bathing</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="washing_showering_bathing_assistance_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assistance Level Required</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assistance level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="independent">Independent</SelectItem>
                          <SelectItem value="supervision">Supervision</SelectItem>
                          <SelectItem value="partial_assistance">Partial Assistance</SelectItem>
                          <SelectItem value="full_assistance">Full Assistance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prefer_bath_or_shower"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bath or Shower Preference</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bath">Bath</SelectItem>
                          <SelectItem value="shower">Shower</SelectItem>
                          <SelectItem value="either">Either</SelectItem>
                          <SelectItem value="bed_bath">Bed Bath</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathing_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathing Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="every_other_day">Every Other Day</SelectItem>
                          <SelectItem value="twice_weekly">Twice Weekly</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="as_needed">As Needed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="wash_hands_face_independently"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Can wash hands and face independently</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="wash_body_independently"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Can wash body independently</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="get_in_out_bath_shower_independently"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Can get in/out of bath/shower independently</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dry_self_independently"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Can dry self independently</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="specific_washing_requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific Washing Requirements</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe any specific washing requirements..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skin_condition_considerations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skin Condition Considerations</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe any skin conditions or considerations..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobility_aids_for_bathing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobility Aids for Bathing</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List any mobility aids required for bathing..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathroom_safety_concerns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathroom Safety Concerns</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe any bathroom safety concerns..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="washing_showering_bathing_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional notes about washing, showering, or bathing..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
