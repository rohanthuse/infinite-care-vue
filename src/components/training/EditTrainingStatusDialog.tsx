import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainingFileUpload } from "@/components/training/TrainingFileUpload";

interface EditTrainingStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: {
    id: string;
    status: string;
    completion_date: string | null;
    expiry_date: string | null;
    score: number | null;
    notes: string | null;
    evidence_files: any[] | null;
    training_course: {
      id: string;
      title: string;
      category: string;
      max_score: number;
      valid_for_months: number | null;
    };
  };
  staffId: string;
  onUpdate: (recordId: string, updates: any) => void;
  isUpdating: boolean;
}

const formSchema = z.object({
  status: z.enum([
    "not-started",
    "in-progress",
    "completed",
    "expired",
    "paused",
    "under-review",
    "failed",
    "renewal-required",
  ]),
  completion_date: z.date().optional().nullable(),
  score: z.number().min(0).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
}).refine((data) => {
  // Completion date is required when status is completed
  if (data.status === "completed" && !data.completion_date) {
    return false;
  }
  return true;
}, {
  message: "Completion date is required when status is completed",
  path: ["completion_date"],
}).refine((data) => {
  // Score must not exceed max_score (we'll validate this separately)
  return true;
}, {
  message: "Score is invalid",
  path: ["score"],
});

export function EditTrainingStatusDialog({
  open,
  onOpenChange,
  record,
  staffId,
  onUpdate,
  isUpdating,
}: EditTrainingStatusDialogProps) {
  const [showCompletionFields, setShowCompletionFields] = useState(record.status === "completed");
  const [evidenceFiles, setEvidenceFiles] = useState(record.evidence_files || []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: record.status as any,
      completion_date: record.completion_date ? new Date(record.completion_date) : null,
      score: record.score,
      notes: record.notes || "",
    },
  });

  const watchStatus = form.watch("status");

  useEffect(() => {
    setShowCompletionFields(watchStatus === "completed");
    
    // Clear completion fields when status changes from completed to other
    if (watchStatus !== "completed") {
      form.setValue("completion_date", null);
    }
  }, [watchStatus, form]);

  // Reset form when dialog opens with new record
  useEffect(() => {
    if (open) {
      form.reset({
        status: record.status as any,
        completion_date: record.completion_date ? new Date(record.completion_date) : null,
        score: record.score,
        notes: record.notes || "",
      });
      setShowCompletionFields(record.status === "completed");
      setEvidenceFiles(record.evidence_files || []);
    }
  }, [open, record, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Validate score against max_score
    if (values.score !== null && values.score !== undefined) {
      if (values.score > record.training_course.max_score) {
        form.setError("score", {
          message: `Score cannot exceed maximum score of ${record.training_course.max_score}`,
        });
        return;
      }
    }

    // Calculate expiry date if status is completed and course has valid_for_months
    let expiry_date = null;
    if (values.status === "completed" && values.completion_date && record.training_course.valid_for_months) {
      const completionDate = new Date(values.completion_date);
      const expiryDate = new Date(completionDate);
      expiryDate.setMonth(expiryDate.getMonth() + record.training_course.valid_for_months);
      expiry_date = expiryDate.toISOString();
    }

    const updates = {
      status: values.status,
      completion_date: values.completion_date ? values.completion_date.toISOString() : null,
      expiry_date,
      score: values.score,
      notes: values.notes || null,
      evidence_files: evidenceFiles,
    };

    onUpdate(record.id, updates);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      core: "bg-primary text-primary-foreground",
      mandatory: "bg-destructive text-destructive-foreground",
      specialized: "bg-secondary text-secondary-foreground",
      optional: "bg-muted text-muted-foreground",
    };
    return colors[category] || colors.optional;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "not-started": "Not Started",
      "in-progress": "In Progress",
      "completed": "Completed",
      "expired": "Expired",
      "paused": "Paused",
      "under-review": "Under Review",
      "failed": "Failed",
      "renewal-required": "Renewal Required",
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Edit Training Status</span>
            <Badge className={getCategoryColor(record.training_course.category)}>
              {record.training_course.category}
            </Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{record.training_course.title}</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="status" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="status">Status & Details</TabsTrigger>
                <TabsTrigger value="certification">Certification</TabsTrigger>
              </TabsList>

              <TabsContent value="status" className="space-y-4 mt-4">
                {/* Status Field */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isUpdating}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="not-started">Not Started</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="under-review">Under Review</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="renewal-required">Renewal Required</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Completion Date Field - Only shown when status is completed */}
                {showCompletionFields && (
                  <>
                    <FormField
                      control={form.control}
                      name="completion_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Completion Date *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={isUpdating}
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
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Score Field - Only shown when status is completed */}
                    <FormField
                      control={form.control}
                      name="score"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Score (Max: {record.training_course.max_score})
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter score"
                              min={0}
                              max={record.training_course.max_score}
                              disabled={isUpdating}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === "" ? null : parseFloat(value));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Notes Field - Always shown */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Notes / Remarks</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes or remarks about this training record..."
                          className="min-h-[100px]"
                          disabled={isUpdating}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="certification" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <FormLabel>Training Certificates & Evidence</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Upload certificates, completion documents, or other evidence
                  </p>
                </div>

                <TrainingFileUpload
                  trainingRecordId={record.id}
                  staffId={staffId}
                  evidenceFiles={evidenceFiles}
                  onFilesUpdate={setEvidenceFiles}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
