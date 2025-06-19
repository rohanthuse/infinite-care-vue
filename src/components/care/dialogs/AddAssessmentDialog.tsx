
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

const assessmentSchema = z.object({
  assessment_type: z.string().min(1, "Assessment type is required"),
  assessment_name: z.string().min(1, "Assessment name is required"),
  assessment_date: z.date(),
  performed_by: z.string().min(1, "Performed by is required"),
  results: z.string().optional(),
  score: z.string().optional(),
  recommendations: z.string().optional(),
  next_review_date: z.date().optional(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

interface AddAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (assessment: AssessmentFormData & { client_id: string }) => void;
  clientId: string;
  isLoading?: boolean;
}

export const AddAssessmentDialog: React.FC<AddAssessmentDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  clientId,
  isLoading = false
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [reviewCalendarOpen, setReviewCalendarOpen] = useState(false);

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      assessment_type: "",
      assessment_name: "",
      assessment_date: new Date(),
      performed_by: "",
      results: "",
      score: "",
      recommendations: "",
    }
  });

  const handleSubmit = (data: AssessmentFormData) => {
    const assessmentData = {
      ...data,
      client_id: clientId,
      score: data.score ? parseInt(data.score) : undefined,
    };
    
    onSave(assessmentData as any);
    form.reset();
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Assessment</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assessment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assessment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cognitive">Cognitive Assessment</SelectItem>
                        <SelectItem value="physical">Physical Assessment</SelectItem>
                        <SelectItem value="mental_health">Mental Health Assessment</SelectItem>
                        <SelectItem value="nutritional">Nutritional Assessment</SelectItem>
                        <SelectItem value="risk">Risk Assessment</SelectItem>
                        <SelectItem value="falls">Falls Risk Assessment</SelectItem>
                        <SelectItem value="medication">Medication Review</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessment_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter assessment name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assessment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Date</FormLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
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
                          onSelect={(date) => {
                            field.onChange(date);
                            setCalendarOpen(false);
                          }}
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
                name="performed_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Performed By</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter assessor name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="results"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Results</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter assessment results and findings..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Score (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="Enter numeric score" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_review_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Review Date (optional)</FormLabel>
                    <Popover open={reviewCalendarOpen} onOpenChange={setReviewCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
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
                          onSelect={(date) => {
                            field.onChange(date);
                            setReviewCalendarOpen(false);
                          }}
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
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendations (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter recommendations based on assessment..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Assessment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
