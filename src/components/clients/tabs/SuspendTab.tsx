import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useClientSuspensions, useSuspendClient, useEndSuspension } from "@/hooks/useClientSuspensions";
import { toast } from "sonner";

const suspendFormSchema = z.object({
  suspensionType: z.enum(["temporary", "indefinite"]),
  fromDate: z.date({
    required_error: "From date is required",
  }),
  untilDate: z.date().optional(),
  reason: z.string().min(1, "Reason is required"),
  additionalNotes: z.string().optional(),
  applyTo: z.object({
    visits: z.boolean().default(false),
    serviceActions: z.boolean().default(false),
    billing: z.boolean().default(false),
    messaging: z.boolean().default(false),
  }),
  notify: z.object({
    client: z.boolean().default(false),
    nextOfKin: z.boolean().default(false),
    carers: z.boolean().default(false),
    admin: z.boolean().default(false),
  }),
  ccEmails: z.string().optional(),
}).refine((data) => {
  if (data.suspensionType === "temporary" && !data.untilDate) {
    return false;
  }
  if (data.suspensionType === "temporary" && data.untilDate && data.fromDate >= data.untilDate) {
    return false;
  }
  return true;
}, {
  message: "Until date is required for temporary suspension and must be after from date",
  path: ["untilDate"],
});

type SuspendFormValues = z.infer<typeof suspendFormSchema>;

interface SuspendTabProps {
  clientId: string;
}

export const SuspendTab: React.FC<SuspendTabProps> = ({ clientId }) => {
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const { data: suspensionStatus, isLoading } = useClientSuspensions(clientId);
  const suspendMutation = useSuspendClient();
  const endSuspensionMutation = useEndSuspension();

  const form = useForm<SuspendFormValues>({
    resolver: zodResolver(suspendFormSchema),
    defaultValues: {
      suspensionType: "temporary",
      fromDate: new Date(),
      applyTo: {
        visits: false,
        serviceActions: false,
        billing: false,
        messaging: false,
      },
      notify: {
        client: false,
        nextOfKin: false,
        carers: false,
        admin: false,
      },
    },
  });

  const watchSuspensionType = form.watch("suspensionType");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: SuspendFormValues) => {
    try {
      await suspendMutation.mutateAsync({
        clientId,
        data: {
          suspension_type: values.suspensionType,
          reason: values.reason,
          details: values.additionalNotes || null,
          effective_from: values.fromDate.toISOString(),
          effective_until: values.untilDate ? values.untilDate.toISOString() : null,
          apply_to: {
            visits: values.applyTo.visits,
            serviceActions: values.applyTo.serviceActions,
            billing: values.applyTo.billing,
            messaging: values.applyTo.messaging,
          },
          notify: {
            client: values.notify.client,
            nextOfKin: values.notify.nextOfKin,
            carers: values.notify.carers,
            admin: values.notify.admin,
            ccEmails: values.ccEmails ? values.ccEmails.split(',').map(email => email.trim()) : [],
          },
          attachments: attachments.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
          })),
        },
      });
      toast.success("Client suspended successfully");
      form.reset();
      setAttachments([]);
    } catch (error) {
      toast.error("Failed to suspend client");
      console.error("Error suspending client:", error);
    }
  };

  const handleEndSuspension = async () => {
    if (!suspensionStatus?.is_suspended || !suspensionStatus?.suspension_id) return;
    
    try {
      await endSuspensionMutation.mutateAsync({
        clientId,
        suspensionId: suspensionStatus.suspension_id,
      });
      toast.success("Client suspension ended successfully");
    } catch (error) {
      toast.error("Failed to end suspension");
      console.error("Error ending suspension:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Status</CardTitle>
            <Badge variant={suspensionStatus?.is_suspended ? "destructive" : "default"}>
              {suspensionStatus?.is_suspended ? "Suspended" : "Active"}
            </Badge>
          </div>
        </CardHeader>
        {suspensionStatus?.is_suspended && (
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Type:</strong> {suspensionStatus.suspension_type}</p>
              <p><strong>From:</strong> {format(new Date(suspensionStatus.effective_from), "PPP")}</p>
              {suspensionStatus.effective_until && (
                <p><strong>Until:</strong> {format(new Date(suspensionStatus.effective_until), "PPP")}</p>
              )}
              <p><strong>Reason:</strong> {suspensionStatus.reason}</p>
            </div>
            <Button 
              onClick={handleEndSuspension}
              disabled={endSuspensionMutation.isPending}
              className="mt-4"
              variant="outline"
            >
              {endSuspensionMutation.isPending ? "Ending..." : "End Suspension"}
            </Button>
          </CardContent>
        )}
      </Card>

      {!suspensionStatus?.is_suspended && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Suspension Details */}
            <Card>
              <CardHeader>
                <CardTitle>Suspension Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="suspensionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suspension Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="temporary" id="temporary" />
                            <Label htmlFor="temporary">Temporary</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="indefinite" id="indefinite" />
                            <Label htmlFor="indefinite">Indefinite</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From</FormLabel>
                        <Popover>
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
                          <PopoverContent className="w-auto p-0 bg-card" align="start">
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

                  {watchSuspensionType === "temporary" && (
                    <FormField
                      control={form.control}
                      name="untilDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Until</FormLabel>
                          <Popover>
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
                            <PopoverContent className="w-auto p-0 bg-card" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date <= new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter reason for suspension" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes"
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

            {/* Apply To */}
            <Card>
              <CardHeader>
                <CardTitle>Apply To</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormField
                  control={form.control}
                  name="applyTo.visits"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Suspend Visits</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applyTo.serviceActions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Suspend Service Actions</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applyTo.billing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Suspend Billing/Invoicing</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applyTo.messaging"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Suspend Messaging</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="notify.client"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Notify Client</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notify.nextOfKin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Notify Next of Kin</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notify.carers"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Notify Assigned Carers</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notify.admin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Notify Branch Admin</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ccEmails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CC Emails</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter email addresses separated by commas"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" asChild>
                    <Button variant="outline" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </Button>
                  </Label>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Attached Files:</p>
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(file.size / 1024)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setAttachments([]);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={suspendMutation.isPending}
                className="bg-destructive hover:bg-destructive/90"
              >
                {suspendMutation.isPending ? "Suspending..." : "Suspend Client"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};