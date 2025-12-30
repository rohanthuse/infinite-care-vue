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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { YesNoToggle } from "@/components/care/forms/YesNoToggle";
import { Home, Accessibility, FileText, Heart } from "lucide-react";

const COMMUNICATION_METHOD_OPTIONS = [
  { value: 'verbal', label: 'Verbal' },
  { value: 'non_verbal', label: 'Non-Verbal' },
  { value: 'sign_language', label: 'Sign Language' },
  { value: 'picture_symbol', label: 'Picture/Symbol Communication' },
  { value: 'written', label: 'Written Communication' },
  { value: 'makaton', label: 'Makaton' },
  { value: 'others', label: 'Others' },
];

interface WizardStep3AboutMeProps {
  form: UseFormReturn<any>;
}

const HOME_TYPE_OPTIONS = [
  { value: 'house', label: 'House' },
  { value: 'flat', label: 'Flat' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'care_home', label: 'Care Home' },
  { value: 'sheltered_housing', label: 'Sheltered Housing' },
  { value: 'other', label: 'Other' },
];

const LIVING_ARRANGEMENT_OPTIONS = [
  { value: 'lives_alone', label: 'Lives Alone' },
  { value: 'with_spouse', label: 'With Spouse/Partner' },
  { value: 'with_family', label: 'With Family' },
  { value: 'with_carer', label: 'With Carer' },
  { value: 'shared_accommodation', label: 'Shared Accommodation' },
  { value: 'other', label: 'Other' },
];

export function WizardStep3AboutMe({ form }: WizardStep3AboutMeProps) {

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">About Me</h2>
        <p className="text-muted-foreground">
          Personal preferences, interests, and important information about the client.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Section: My Home */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-5 w-5 text-primary" />
                My Home
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="about_me.has_key_safe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you have a key safe?</FormLabel>
                      <FormControl>
                        <YesNoToggle
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("about_me.has_key_safe") === true && (
                  <FormField
                    control={form.control}
                    name="about_me.key_safe_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Safe Code/Location</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter key safe code and location..."
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
                  name="about_me.requires_heating_help"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you require help managing heating?</FormLabel>
                      <FormControl>
                        <YesNoToggle
                          value={field.value}
                          onChange={field.onChange}
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
                  name="about_me.home_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select home type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HOME_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="about_me.living_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Living Status</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Independent, needs assistance..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section: My Accessibility and Communication */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Accessibility className="h-5 w-5 text-primary" />
                My Accessibility and Communication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vision Impairment - Yes/No/Unknown */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="about_me.is_visually_impaired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Are you blind or partially sighted?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="vision-yes" />
                            <Label htmlFor="vision-yes" className="cursor-pointer">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="vision-no" />
                            <Label htmlFor="vision-no" className="cursor-pointer">No</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="unknown" id="vision-unknown" />
                            <Label htmlFor="vision-unknown" className="cursor-pointer">Unknown</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="about_me.vision_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vision Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe vision condition and needs..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Hearing Impairment - Yes/No/Unknown */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="about_me.is_hearing_impaired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Are you deaf or hard of hearing?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="hearing-yes" />
                            <Label htmlFor="hearing-yes" className="cursor-pointer">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="hearing-no" />
                            <Label htmlFor="hearing-no" className="cursor-pointer">No</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="unknown" id="hearing-unknown" />
                            <Label htmlFor="hearing-unknown" className="cursor-pointer">Unknown</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="about_me.hearing_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hearing Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe hearing condition and needs..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Interpreter Requirement - Yes/No/Unknown */}
              <FormField
                control={form.control}
                name="about_me.requires_interpreter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Do you need an interpreter to communicate effectively?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="interpreter-yes" />
                          <Label htmlFor="interpreter-yes" className="cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="interpreter-no" />
                          <Label htmlFor="interpreter-no" className="cursor-pointer">No</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="unknown" id="interpreter-unknown" />
                          <Label htmlFor="interpreter-unknown" className="cursor-pointer">Unknown</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="about_me.mobility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobility</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Describe mobility level and any aids used..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Communication Needs - Dropdown */}
              <FormField
                control={form.control}
                name="about_me.communication_needs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Needs</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select communication method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMMUNICATION_METHOD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="about_me.how_i_communicate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How I Communicate</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe how you communicate..."
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
                name="about_me.how_to_communicate_with_me"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How to Communicate with Me</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Guidance on how others should communicate with you..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section: Status & Legal Directives */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Status & Legal Directives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="about_me.ethnicity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ethnicity</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter ethnicity..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="about_me.living_arrangement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Living Arrangement</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select living arrangement" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LIVING_ARRANGEMENT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="about_me.has_dnr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DNR in place?</FormLabel>
                      <FormControl>
                        <YesNoToggle
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="about_me.has_respect"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ReSPECT in place?</FormLabel>
                      <FormControl>
                        <YesNoToggle
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="about_me.has_dols"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DoLS in place?</FormLabel>
                      <FormControl>
                        <YesNoToggle
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="about_me.has_lpa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LPA in place?</FormLabel>
                      <FormControl>
                        <YesNoToggle
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* LPA Holder Details - shown when LPA is Yes */}
              {form.watch("about_me.has_lpa") === "yes" && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium text-sm">LPA Holder Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="about_me.lpa_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LPA Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select LPA type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="health_welfare">Health & Welfare</SelectItem>
                              <SelectItem value="property_financial">Property & Financial</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="about_me.lpa_holder_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LPA Holder Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter LPA holder's name..."
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="about_me.lpa_holder_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LPA Holder Phone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter phone number..."
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="about_me.lpa_holder_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LPA Holder Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Enter email address..."
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section: My Life & Personality (existing fields) */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-primary" />
                My Life & Personality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="about_me.life_history"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Life History</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about the client's background, career, family..."
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
                name="about_me.personality_traits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personality Traits</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the client's personality, preferences, and characteristics..."
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
                name="about_me.communication_style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Style</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Direct, gentle, requires patience..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="about_me.important_people"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Important People</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List important people in the client's life..."
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
                name="about_me.meaningful_activities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meaningful Activities</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Activities that bring joy and meaning to the client..."
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
                name="about_me.what_is_most_important_to_me"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What is most important to me</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What matters most to the client..."
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
                name="about_me.how_to_communicate_with_me"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How to communicate with me</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Best ways to communicate with the client..."
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
                name="about_me.please_do"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please do</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Things the client would like caregivers to do..."
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
                name="about_me.please_dont"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please don't</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Things the client would prefer caregivers not to do..."
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
                name="about_me.my_wellness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>My wellness</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Information about the client's wellness and wellbeing..."
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
                name="about_me.how_and_when_to_support_me"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How and when to support me</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Specific support needs and timing..."
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
                name="about_me.also_worth_knowing_about_me"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Also worth knowing about me</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional important information about the client..."
                        className="min-h-[80px]"
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
                  name="about_me.date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
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
                  name="about_me.time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time"
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
                name="about_me.supported_to_write_this_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supported to write this by</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Name of person who helped write this..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </Form>
    </div>
  );
}
