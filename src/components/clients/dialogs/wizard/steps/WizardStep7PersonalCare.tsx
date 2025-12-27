
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WizardStep7PersonalCareProps {
  form: UseFormReturn<any>;
}

export function WizardStep7PersonalCare({ form }: WizardStep7PersonalCareProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Personal Care</h2>
        <p className="text-muted-foreground">
          Daily living assistance and personal care requirements.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="personal_care.dressing_assistance_level"
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
                      <SelectItem value="minimal_assistance">Minimal Assistance</SelectItem>
                      <SelectItem value="moderate_assistance">Moderate Assistance</SelectItem>
                      <SelectItem value="full_assistance">Full Assistance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personal_care.toileting_assistance_level"
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
                      <SelectItem value="minimal_assistance">Minimal Assistance</SelectItem>
                      <SelectItem value="moderate_assistance">Moderate Assistance</SelectItem>
                      <SelectItem value="full_assistance">Full Assistance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personal_care.continence_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Continence Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="continent">Continent</SelectItem>
                      <SelectItem value="occasional_accidents">Occasional Accidents</SelectItem>
                      <SelectItem value="incontinent">Incontinent</SelectItem>
                      <SelectItem value="catheter">Catheter</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="personal_care.bathing_preferences"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bathing Preferences</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe bathing preferences, frequency, temperature, special requirements..."
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
            name="personal_care.personal_hygiene_needs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personal Hygiene Needs</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe personal hygiene assistance requirements..."
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
            name="personal_care.sleep_patterns"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sleep Patterns</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe sleep schedule, habits, and any sleep-related issues..."
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
            name="personal_care.skin_care_needs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skin Care Needs</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe any special skin care requirements, conditions, or treatments..."
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
            name="personal_care.pain_management"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pain Management</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe pain management strategies, medications, or therapies..."
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
            name="personal_care.comfort_measures"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comfort Measures</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe comfort measures, positioning, environmental preferences..."
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
            name="personal_care.behavioral_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Behavioral Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Note any behavioral patterns, triggers, or management strategies..."
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Incontinence Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Incontinence</h3>
            <FormField
              control={form.control}
              name="personal_care.incontinence_products_required"
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
                        <RadioGroupItem value="yes" id="wizard-incontinence-yes" />
                        <Label htmlFor="wizard-incontinence-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="wizard-incontinence-no" />
                        <Label htmlFor="wizard-incontinence-no">No</Label>
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
            <h3 className="text-lg font-medium text-foreground">Sleep</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="personal_care.sleep_go_to_bed_time"
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
                name="personal_care.sleep_wake_up_time"
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
                name="personal_care.sleep_get_out_of_bed_time"
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
              name="personal_care.sleep_prepare_duration"
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
                name="personal_care.assist_going_to_bed"
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
                          <RadioGroupItem value="yes" id="wizard-assist-bed-yes" />
                          <Label htmlFor="wizard-assist-bed-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="wizard-assist-bed-no" />
                          <Label htmlFor="wizard-assist-bed-no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personal_care.assist_getting_out_of_bed"
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
                          <RadioGroupItem value="yes" id="wizard-assist-out-yes" />
                          <Label htmlFor="wizard-assist-out-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="wizard-assist-out-no" />
                          <Label htmlFor="wizard-assist-out-no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personal_care.panic_button_in_bed"
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
                          <RadioGroupItem value="yes" id="wizard-panic-button-yes" />
                          <Label htmlFor="wizard-panic-button-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="wizard-panic-button-no" />
                          <Label htmlFor="wizard-panic-button-no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personal_care.assist_turn_to_sleep_position"
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
                          <RadioGroupItem value="yes" id="wizard-assist-turn-yes" />
                          <Label htmlFor="wizard-assist-turn-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="wizard-assist-turn-no" />
                          <Label htmlFor="wizard-assist-turn-no">No</Label>
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
                name="personal_care.washing_showering_bathing_assistance_level"
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
                name="personal_care.prefer_bath_or_shower"
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
                name="personal_care.bathing_frequency"
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
                  name="personal_care.wash_hands_face_independently"
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
                  name="personal_care.wash_body_independently"
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
                  name="personal_care.get_in_out_bath_shower_independently"
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
                  name="personal_care.dry_self_independently"
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
                name="personal_care.specific_washing_requirements"
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
                name="personal_care.skin_condition_considerations"
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
                name="personal_care.mobility_aids_for_bathing"
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
                name="personal_care.bathroom_safety_concerns"
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
                name="personal_care.washing_showering_bathing_notes"
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

          {/* Oral Care Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Oral Care</h3>
            
            <FormField
              control={form.control}
              name="personal_care.oral_care_assist_cleaning_teeth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Do you require assistance with cleaning your teeth?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value === true ? 'yes' : field.value === false ? 'no' : ''}
                      onValueChange={(value) => field.onChange(value === 'yes')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="wizard-oral-teeth-yes" />
                        <Label htmlFor="wizard-oral-teeth-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="wizard-oral-teeth-no" />
                        <Label htmlFor="wizard-oral-teeth-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personal_care.oral_care_assist_cleaning_dentures"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Do you require assistance with cleaning dentures/retainers?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value === true ? 'yes' : field.value === false ? 'no' : ''}
                      onValueChange={(value) => field.onChange(value === 'yes')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="wizard-oral-dentures-yes" />
                        <Label htmlFor="wizard-oral-dentures-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="wizard-oral-dentures-no" />
                        <Label htmlFor="wizard-oral-dentures-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personal_care.oral_care_summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide a summary of oral care needs and preferences..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Podiatry Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Podiatry</h3>
            
            <FormField
              control={form.control}
              name="personal_care.has_podiatrist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Do you have a Podiatrist?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value === true ? 'yes' : field.value === false ? 'no' : ''}
                      onValueChange={(value) => field.onChange(value === 'yes')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="wizard-podiatrist-yes" />
                        <Label htmlFor="wizard-podiatrist-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="wizard-podiatrist-no" />
                        <Label htmlFor="wizard-podiatrist-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Personal care related Risks Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Personal care related Risks</h3>
            
            <FormField
              control={form.control}
              name="personal_care.personal_care_risks_explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explanation</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explain any personal care related risks or concerns..."
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
      </Form>
    </div>
  );
}
