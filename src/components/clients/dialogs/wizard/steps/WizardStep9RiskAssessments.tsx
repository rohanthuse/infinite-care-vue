
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Calendar } from "lucide-react";
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
import { AutoExpandingTextarea } from "@/components/ui/auto-expanding-textarea";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface WizardStep9RiskAssessmentsProps {
  form: UseFormReturn<any>;
}

export function WizardStep9RiskAssessments({ form }: WizardStep9RiskAssessmentsProps) {
  const addRiskAssessment = () => {
    const current = form.getValues("risk_assessments") || [];
    form.setValue("risk_assessments", [...current, {
      risk_type: "",
      risk_level: "low",
      risk_factors: [],
      mitigation_strategies: [],
      review_date: null,
      assessed_by: "",
      // Risk section
      rag_status: "",
      has_pets: false,
      fall_risk: "",
      risk_to_staff: [],
      adverse_weather_plan: "",
      // Personal Risk section
      lives_alone: false,
      rural_area: false,
      cared_in_bed: false,
      smoker: false,
      can_call_for_assistance: false,
      communication_needs: "",
      social_support: "",
      fallen_past_six_months: false,
      has_assistance_device: false,
      arrange_assistance_device: false,
    }]);
  };

  const removeRiskAssessment = (index: number) => {
    const current = form.getValues("risk_assessments") || [];
    form.setValue("risk_assessments", current.filter((_, i) => i !== index));
  };

  const addRiskFactor = (assessmentIndex: number) => {
    const current = form.getValues(`risk_assessments.${assessmentIndex}.risk_factors`) || [];
    form.setValue(`risk_assessments.${assessmentIndex}.risk_factors`, [...current, ""]);
  };

  const removeRiskFactor = (assessmentIndex: number, factorIndex: number) => {
    const current = form.getValues(`risk_assessments.${assessmentIndex}.risk_factors`) || [];
    form.setValue(`risk_assessments.${assessmentIndex}.risk_factors`, current.filter((_, i) => i !== factorIndex));
  };

  const addMitigationStrategy = (assessmentIndex: number) => {
    const current = form.getValues(`risk_assessments.${assessmentIndex}.mitigation_strategies`) || [];
    form.setValue(`risk_assessments.${assessmentIndex}.mitigation_strategies`, [...current, ""]);
  };

  const removeMitigationStrategy = (assessmentIndex: number, strategyIndex: number) => {
    const current = form.getValues(`risk_assessments.${assessmentIndex}.mitigation_strategies`) || [];
    form.setValue(`risk_assessments.${assessmentIndex}.mitigation_strategies`, current.filter((_, i) => i !== strategyIndex));
  };

  const riskAssessments = form.watch("risk_assessments") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Risk Assessments</h2>
        <p className="text-gray-600">
          Identify and assess safety risks with appropriate mitigation strategies.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Risk Assessments</h3>
            <Button type="button" onClick={addRiskAssessment} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Risk Assessment
            </Button>
          </div>

          {riskAssessments.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <p>No risk assessments added yet. Click "Add Risk Assessment" to create your first assessment.</p>
            </div>
          )}

          {riskAssessments.map((_, assessmentIndex) => (
            <div key={assessmentIndex} className="border rounded-lg p-6 space-y-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium">Risk Assessment {assessmentIndex + 1}</h4>
                <Button
                  type="button"
                  onClick={() => removeRiskAssessment(assessmentIndex)}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`risk_assessments.${assessmentIndex}.risk_type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Type *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Falls, Medication, Wandering" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`risk_assessments.${assessmentIndex}.risk_level`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select risk level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`risk_assessments.${assessmentIndex}.assessed_by`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessed By</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter assessor name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`risk_assessments.${assessmentIndex}.review_date`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Review Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick review date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Risk Factors */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Risk Factors</FormLabel>
                  <Button 
                    type="button" 
                    onClick={() => addRiskFactor(assessmentIndex)} 
                    size="sm" 
                    variant="outline"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Factor
                  </Button>
                </div>
                {(form.watch(`risk_assessments.${assessmentIndex}.risk_factors`) || []).map((_, factorIndex) => (
                  <div key={factorIndex} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`risk_assessments.${assessmentIndex}.risk_factors.${factorIndex}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <AutoExpandingTextarea 
                              placeholder="Enter risk factor" 
                              minRows={1} 
                              maxHeight={80} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      onClick={() => removeRiskFactor(assessmentIndex, factorIndex)}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Mitigation Strategies */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Mitigation Strategies</FormLabel>
                  <Button 
                    type="button" 
                    onClick={() => addMitigationStrategy(assessmentIndex)} 
                    size="sm" 
                    variant="outline"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Strategy
                  </Button>
                </div>
                {(form.watch(`risk_assessments.${assessmentIndex}.mitigation_strategies`) || []).map((_, strategyIndex) => (
                  <div key={strategyIndex} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`risk_assessments.${assessmentIndex}.mitigation_strategies.${strategyIndex}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <AutoExpandingTextarea 
                              placeholder="Enter mitigation strategy" 
                              minRows={1} 
                              maxHeight={80} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      onClick={() => removeMitigationStrategy(assessmentIndex, strategyIndex)}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Risk Section */}
              <div className="space-y-4 pt-6 border-t">
                <h4 className="text-lg font-semibold text-gray-800">Risk</h4>
                
                <FormField
                  control={form.control}
                  name={`risk_assessments.${assessmentIndex}.rag_status`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RAG Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-wrap gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="" id={`rag-none-${assessmentIndex}`} />
                            <FormLabel htmlFor={`rag-none-${assessmentIndex}`} className="text-sm">None</FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="green" id={`rag-green-${assessmentIndex}`} />
                            <FormLabel htmlFor={`rag-green-${assessmentIndex}`} className="text-sm text-green-600">Green</FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="amber" id={`rag-amber-${assessmentIndex}`} />
                            <FormLabel htmlFor={`rag-amber-${assessmentIndex}`} className="text-sm text-amber-600">Amber</FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="red" id={`rag-red-${assessmentIndex}`} />
                            <FormLabel htmlFor={`rag-red-${assessmentIndex}`} className="text-sm text-red-600">Red</FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`risk_assessments.${assessmentIndex}.has_pets`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Has Pets</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "yes")}
                          defaultValue={field.value ? "yes" : "no"}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id={`has-pets-yes-${assessmentIndex}`} />
                            <FormLabel htmlFor={`has-pets-yes-${assessmentIndex}`} className="text-sm">Yes</FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`has-pets-no-${assessmentIndex}`} />
                            <FormLabel htmlFor={`has-pets-no-${assessmentIndex}`} className="text-sm">No</FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`risk_assessments.${assessmentIndex}.fall_risk`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fall Risk</FormLabel>
                      <FormControl>
                        <AutoExpandingTextarea 
                          placeholder="Describe fall risk factors..." 
                          minRows={2} 
                          maxHeight={150} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`risk_assessments.${assessmentIndex}.adverse_weather_plan`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adverse Weather Plan</FormLabel>
                      <FormControl>
                        <AutoExpandingTextarea 
                          placeholder="Describe adverse weather contingency plan..." 
                          minRows={2} 
                          maxHeight={150} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Personal Risk Section */}
              <div className="space-y-4 pt-6 border-t">
                <h4 className="text-lg font-semibold text-gray-800">Personal Risk</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`risk_assessments.${assessmentIndex}.lives_alone`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lives Alone</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "yes")}
                            defaultValue={field.value ? "yes" : "no"}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`lives-alone-yes-${assessmentIndex}`} />
                              <FormLabel htmlFor={`lives-alone-yes-${assessmentIndex}`} className="text-sm">Yes</FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`lives-alone-no-${assessmentIndex}`} />
                              <FormLabel htmlFor={`lives-alone-no-${assessmentIndex}`} className="text-sm">No</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`risk_assessments.${assessmentIndex}.rural_area`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lives in Rural Area</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "yes")}
                            defaultValue={field.value ? "yes" : "no"}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`rural-area-yes-${assessmentIndex}`} />
                              <FormLabel htmlFor={`rural-area-yes-${assessmentIndex}`} className="text-sm">Yes</FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`rural-area-no-${assessmentIndex}`} />
                              <FormLabel htmlFor={`rural-area-no-${assessmentIndex}`} className="text-sm">No</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`risk_assessments.${assessmentIndex}.cared_in_bed`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cared in Bed</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "yes")}
                            defaultValue={field.value ? "yes" : "no"}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`cared-in-bed-yes-${assessmentIndex}`} />
                              <FormLabel htmlFor={`cared-in-bed-yes-${assessmentIndex}`} className="text-sm">Yes</FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`cared-in-bed-no-${assessmentIndex}`} />
                              <FormLabel htmlFor={`cared-in-bed-no-${assessmentIndex}`} className="text-sm">No</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`risk_assessments.${assessmentIndex}.smoker`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Smoker</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "yes")}
                            defaultValue={field.value ? "yes" : "no"}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`smoker-yes-${assessmentIndex}`} />
                              <FormLabel htmlFor={`smoker-yes-${assessmentIndex}`} className="text-sm">Yes</FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`smoker-no-${assessmentIndex}`} />
                              <FormLabel htmlFor={`smoker-no-${assessmentIndex}`} className="text-sm">No</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`risk_assessments.${assessmentIndex}.can_call_for_assistance`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Can Call for Assistance</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "yes")}
                            defaultValue={field.value ? "yes" : "no"}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`can-call-yes-${assessmentIndex}`} />
                              <FormLabel htmlFor={`can-call-yes-${assessmentIndex}`} className="text-sm">Yes</FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`can-call-no-${assessmentIndex}`} />
                              <FormLabel htmlFor={`can-call-no-${assessmentIndex}`} className="text-sm">No</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`risk_assessments.${assessmentIndex}.fallen_past_six_months`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fallen in Past Six Months</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "yes")}
                            defaultValue={field.value ? "yes" : "no"}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`fallen-yes-${assessmentIndex}`} />
                              <FormLabel htmlFor={`fallen-yes-${assessmentIndex}`} className="text-sm">Yes</FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`fallen-no-${assessmentIndex}`} />
                              <FormLabel htmlFor={`fallen-no-${assessmentIndex}`} className="text-sm">No</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`risk_assessments.${assessmentIndex}.has_assistance_device`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Has Assistance Device</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "yes")}
                            defaultValue={field.value ? "yes" : "no"}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`has-device-yes-${assessmentIndex}`} />
                              <FormLabel htmlFor={`has-device-yes-${assessmentIndex}`} className="text-sm">Yes</FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`has-device-no-${assessmentIndex}`} />
                              <FormLabel htmlFor={`has-device-no-${assessmentIndex}`} className="text-sm">No</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`risk_assessments.${assessmentIndex}.arrange_assistance_device`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arrange Assistance Device</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "yes")}
                            defaultValue={field.value ? "yes" : "no"}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`arrange-device-yes-${assessmentIndex}`} />
                              <FormLabel htmlFor={`arrange-device-yes-${assessmentIndex}`} className="text-sm">Yes</FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`arrange-device-no-${assessmentIndex}`} />
                              <FormLabel htmlFor={`arrange-device-no-${assessmentIndex}`} className="text-sm">No</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`risk_assessments.${assessmentIndex}.communication_needs`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Communication Needs</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe communication needs..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`risk_assessments.${assessmentIndex}.social_support`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Support</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe social support network..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Equipment & Dietary Risk Section */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-800">Equipment & Dietary Risk</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="risk_equipment_dietary.equipment_required"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment Required</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "yes")}
                        defaultValue={field.value ? "yes" : "no"}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="equipment-required-yes" />
                          <FormLabel htmlFor="equipment-required-yes" className="text-sm">Yes</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="equipment-required-no" />
                          <FormLabel htmlFor="equipment-required-no" className="text-sm">No</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_dietary_food.dietary_restrictions_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dietary Restrictions Risk</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "yes")}
                        defaultValue={field.value ? "yes" : "no"}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="dietary-restrictions-yes" />
                          <FormLabel htmlFor="dietary-restrictions-yes" className="text-sm">Yes</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="dietary-restrictions-no" />
                          <FormLabel htmlFor="dietary-restrictions-no" className="text-sm">No</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="risk_equipment_dietary.equipment_breakdown_impact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Breakdown Impact</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the impact if equipment breaks down..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_equipment_dietary.equipment_backup_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Backup Plan</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe backup plan for equipment failures..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_equipment_dietary.dietary_emergency_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dietary Emergency Plan</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe emergency plan for dietary issues..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_equipment_dietary.special_dietary_equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Dietary Equipment</FormLabel>
                  <FormControl>
                    <Textarea placeholder="List any special equipment needed for dietary requirements..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Medication Risk Section */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-800">Medication Risk</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="risk_medication.medication_errors_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Errors Risk</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "yes")}
                        defaultValue={field.value ? "yes" : "no"}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="med-errors-yes" />
                          <FormLabel htmlFor="med-errors-yes" className="text-sm">Yes</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="med-errors-no" />
                          <FormLabel htmlFor="med-errors-no" className="text-sm">No</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_medication.medication_compliance_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Compliance Risk</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "yes")}
                        defaultValue={field.value ? "yes" : "no"}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="med-compliance-yes" />
                          <FormLabel htmlFor="med-compliance-yes" className="text-sm">Yes</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="med-compliance-no" />
                          <FormLabel htmlFor="med-compliance-no" className="text-sm">No</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_medication.medication_storage_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Storage Risk</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "yes")}
                        defaultValue={field.value ? "yes" : "no"}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="med-storage-yes" />
                          <FormLabel htmlFor="med-storage-yes" className="text-sm">Yes</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="med-storage-no" />
                          <FormLabel htmlFor="med-storage-no" className="text-sm">No</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_medication.medication_side_effects_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Side Effects Risk</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "yes")}
                        defaultValue={field.value ? "yes" : "no"}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="med-side-effects-yes" />
                          <FormLabel htmlFor="med-side-effects-yes" className="text-sm">Yes</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="med-side-effects-no" />
                          <FormLabel htmlFor="med-side-effects-no" className="text-sm">No</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_medication.medication_interaction_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Interaction Risk</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "yes")}
                        defaultValue={field.value ? "yes" : "no"}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="med-interaction-yes" />
                          <FormLabel htmlFor="med-interaction-yes" className="text-sm">Yes</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="med-interaction-no" />
                          <FormLabel htmlFor="med-interaction-no" className="text-sm">No</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="risk_medication.medication_emergency_contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medication Emergency Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter emergency contact for medication issues..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_medication.medication_contingency_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medication Contingency Plan</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe contingency plan for medication-related emergencies..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dietary & Food Risk Section */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-800">Dietary & Food Risk</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="risk_dietary_food.food_allergies_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Food Allergies Risk</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "yes")}
                        defaultValue={field.value ? "yes" : "no"}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="food-allergies-yes" />
                          <FormLabel htmlFor="food-allergies-yes" className="text-sm">Yes</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="food-allergies-no" />
                          <FormLabel htmlFor="food-allergies-no" className="text-sm">No</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_dietary_food.choking_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Choking Risk</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "yes")}
                        defaultValue={field.value ? "yes" : "no"}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="choking-risk-yes" />
                          <FormLabel htmlFor="choking-risk-yes" className="text-sm">Yes</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="choking-risk-no" />
                          <FormLabel htmlFor="choking-risk-no" className="text-sm">No</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_dietary_food.nutritional_deficiency_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nutritional Deficiency Risk</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "yes")}
                        defaultValue={field.value ? "yes" : "no"}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="nutritional-deficiency-yes" />
                          <FormLabel htmlFor="nutritional-deficiency-yes" className="text-sm">Yes</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="nutritional-deficiency-no" />
                          <FormLabel htmlFor="nutritional-deficiency-no" className="text-sm">No</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_dietary_food.food_poisoning_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Food Poisoning Risk</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "yes")}
                        defaultValue={field.value ? "yes" : "no"}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="food-poisoning-yes" />
                          <FormLabel htmlFor="food-poisoning-yes" className="text-sm">Yes</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="food-poisoning-no" />
                          <FormLabel htmlFor="food-poisoning-no" className="text-sm">No</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_dietary_food.eating_disorder_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eating Disorder Risk</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "yes")}
                        defaultValue={field.value ? "yes" : "no"}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="eating-disorder-yes" />
                          <FormLabel htmlFor="eating-disorder-yes" className="text-sm">Yes</FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="eating-disorder-no" />
                          <FormLabel htmlFor="eating-disorder-no" className="text-sm">No</FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="risk_dietary_food.food_preparation_safety"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Preparation Safety</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe food preparation safety measures..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_dietary_food.emergency_nutrition_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Nutrition Plan</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe emergency nutrition plan..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Warning & Instructions Section */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-800">Warning & Instructions</h3>
            
            <FormField
              control={form.control}
              name="risk_warning_instructions.warning_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warning Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter any critical warnings or precautions..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_warning_instructions.special_instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter specific instructions for care providers..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_warning_instructions.emergency_contacts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contacts</FormLabel>
                  <FormControl>
                    <Textarea placeholder="List emergency contact information..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_warning_instructions.important_information"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Important Information</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any other important information to highlight..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Choking Section */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-800">Choking</h3>
            
            <FormField
              control={form.control}
              name="risk_choking.choking_risk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Choking Risk Present</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === "yes")}
                      defaultValue={field.value ? "yes" : "no"}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="choking-risk-present-yes" />
                        <FormLabel htmlFor="choking-risk-present-yes" className="text-sm">Yes</FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="choking-risk-present-no" />
                        <FormLabel htmlFor="choking-risk-present-no" className="text-sm">No</FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_choking.risk_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select choking risk level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_choking.mitigation_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mitigation Plan</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe plans to reduce choking risk..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_choking.emergency_procedure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Procedure</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe emergency procedures if choking occurs..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Pressure Damage Section */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-800">Pressure Damage</h3>
            
            <FormField
              control={form.control}
              name="risk_pressure_damage.pressure_damage_risk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pressure Damage Risk Present</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === "yes")}
                      defaultValue={field.value ? "yes" : "no"}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="pressure-damage-risk-yes" />
                        <FormLabel htmlFor="pressure-damage-risk-yes" className="text-sm">Yes</FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="pressure-damage-risk-no" />
                        <FormLabel htmlFor="pressure-damage-risk-no" className="text-sm">No</FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_pressure_damage.risk_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pressure damage risk level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_pressure_damage.prevention_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prevention Plan</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe prevention strategies for pressure damage..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_pressure_damage.monitoring_schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monitoring Schedule</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe monitoring schedule and procedures..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_pressure_damage.equipment_needed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Needed</FormLabel>
                  <FormControl>
                    <Textarea placeholder="List equipment needed for pressure damage prevention..." {...field} />
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
