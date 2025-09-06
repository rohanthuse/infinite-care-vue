
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ClientRiskAssessment } from "@/hooks/useClientRiskAssessments";

const formSchema = z.object({
  risk_type: z.string().min(1, "Risk type is required"),
  risk_level: z.string().min(1, "Risk level is required"),
  risk_factors: z.string().min(1, "Risk factors are required"),
  mitigation_strategies: z.string().min(1, "Mitigation strategies are required"),
  assessment_date: z.date({
    required_error: "Assessment date is required",
  }),
  assessed_by: z.string().min(1, "Assessed by is required"),
  review_date: z.date().optional(),
  status: z.string().default("active"),
  // Risk section
  rag_status: z.string().optional(),
  has_pets: z.boolean().optional(),
  fall_risk: z.string().optional(),
  risk_to_staff: z.string().optional(),
  adverse_weather_plan: z.string().optional(),
  // Personal Risk section
  lives_alone: z.boolean().optional(),
  rural_area: z.boolean().optional(),
  cared_in_bed: z.boolean().optional(),
  smoker: z.boolean().optional(),
  can_call_for_assistance: z.boolean().optional(),
  communication_needs: z.string().optional(),
  social_support: z.string().optional(),
  fallen_past_six_months: z.boolean().optional(),
  has_assistance_device: z.boolean().optional(),
  arrange_assistance_device: z.boolean().optional(),
});

interface EditRiskAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  riskAssessment?: ClientRiskAssessment;
  isLoading?: boolean;
}

export const EditRiskAssessmentDialog: React.FC<EditRiskAssessmentDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  riskAssessment,
  isLoading = false,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      risk_type: riskAssessment?.risk_type || "",
      risk_level: riskAssessment?.risk_level || "",
      risk_factors: riskAssessment?.risk_factors?.join('\n') || "",
      mitigation_strategies: riskAssessment?.mitigation_strategies?.join('\n') || "",
      assessment_date: riskAssessment?.assessment_date ? new Date(riskAssessment.assessment_date) : new Date(),
      assessed_by: riskAssessment?.assessed_by || "",
      review_date: riskAssessment?.review_date ? new Date(riskAssessment.review_date) : undefined,
      status: riskAssessment?.status || "active",
    },
  });

  React.useEffect(() => {
    if (riskAssessment && open) {
      form.reset({
        risk_type: riskAssessment.risk_type,
        risk_level: riskAssessment.risk_level,
        risk_factors: riskAssessment.risk_factors?.join('\n') || "",
        mitigation_strategies: riskAssessment.mitigation_strategies?.join('\n') || "",
        assessment_date: new Date(riskAssessment.assessment_date),
        assessed_by: riskAssessment.assessed_by,
        review_date: riskAssessment.review_date ? new Date(riskAssessment.review_date) : undefined,
        status: riskAssessment.status,
      });
    }
  }, [riskAssessment, open, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const formattedData = {
      risk_type: values.risk_type,
      risk_level: values.risk_level,
      risk_factors: values.risk_factors.split('\n').filter(f => f.trim()),
      mitigation_strategies: values.mitigation_strategies.split('\n').filter(s => s.trim()),
      assessment_date: values.assessment_date.toISOString().split('T')[0],
      assessed_by: values.assessed_by,
      review_date: values.review_date ? values.review_date.toISOString().split('T')[0] : null,
      status: values.status,
      // Risk section
      rag_status: values.rag_status,
      has_pets: values.has_pets,
      fall_risk: values.fall_risk,
      risk_to_staff: values.risk_to_staff ? values.risk_to_staff.split('\n').filter(r => r.trim()) : [],
      adverse_weather_plan: values.adverse_weather_plan,
      // Personal Risk section
      lives_alone: values.lives_alone,
      rural_area: values.rural_area,
      cared_in_bed: values.cared_in_bed,
      smoker: values.smoker,
      can_call_for_assistance: values.can_call_for_assistance,
      communication_needs: values.communication_needs,
      social_support: values.social_support,
      fallen_past_six_months: values.fallen_past_six_months,
      has_assistance_device: values.has_assistance_device,
      arrange_assistance_device: values.arrange_assistance_device,
    };
    
    onSave(formattedData);
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Risk Assessment</DialogTitle>
          <DialogDescription>
            Update the risk assessment details.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="risk_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="falls">Falls Risk</SelectItem>
                        <SelectItem value="medication">Medication Risk</SelectItem>
                        <SelectItem value="choking">Choking Risk</SelectItem>
                        <SelectItem value="wandering">Wandering Risk</SelectItem>
                        <SelectItem value="self-harm">Self-harm Risk</SelectItem>
                        <SelectItem value="infection">Infection Risk</SelectItem>
                        <SelectItem value="pressure-sores">Pressure Sores</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_level"
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

            <FormField
              control={form.control}
              name="risk_factors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Factors (one per line)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter risk factors, one per line..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mitigation_strategies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mitigation Strategies (one per line)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter mitigation strategies, one per line..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assessment_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Assessment Date</FormLabel>
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
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="review_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Review Date (Optional)</FormLabel>
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
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
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

            <FormField
              control={form.control}
              name="assessed_by"
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Risk Section */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-800">Risk</h3>
              
              <FormField
                control={form.control}
                name="rag_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RAG Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select RAG status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="has_pets"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Has Pets</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="fall_risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fall Risk</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe fall risk factors..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk_to_staff"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk to Staff (one per line)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter risks to staff, one per line..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adverse_weather_plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adverse Weather Plan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe adverse weather contingency plan..."
                        className="resize-none"
                        rows={3}
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
              <h3 className="text-lg font-semibold text-gray-800">Personal Risk</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lives_alone"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Lives Alone</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rural_area"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Rural Area</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cared_in_bed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Cared in Bed</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smoker"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Smoker</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="can_call_for_assistance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Can Call for Assistance</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fallen_past_six_months"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Fallen in Past 6 Months</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="has_assistance_device"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Has Assistance Device</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrange_assistance_device"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Arrange Assistance Device</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="communication_needs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Needs</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe communication needs..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_support"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Support</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe social support network..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Update Assessment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
