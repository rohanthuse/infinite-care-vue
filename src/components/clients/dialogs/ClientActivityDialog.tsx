import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientActivity } from "@/hooks/useClientActivities";

const activitySchema = z.object({
  name: z.string().min(1, "Activity name is required"),
  description: z.string().optional(),
  frequency: z.string().min(1, "Frequency is required"),
  status: z.string().min(1, "Status is required"),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

interface ClientActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (activity: ActivityFormValues) => void;
  mode: 'add' | 'edit' | 'view';
  activity?: ClientActivity;
  isLoading?: boolean;
}

export const ClientActivityDialog: React.FC<ClientActivityDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  mode,
  activity,
  isLoading = false,
}) => {
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: "",
      description: "",
      frequency: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open && mode === 'edit' && activity) {
      form.reset({
        name: activity.name,
        description: activity.description || "",
        frequency: activity.frequency,
        status: activity.status,
      });
    } else if (open && mode === 'view' && activity) {
      form.reset({
        name: activity.name,
        description: activity.description || "",
        frequency: activity.frequency,
        status: activity.status,
      });
    } else if (open && mode === 'add') {
      form.reset({
        name: "",
        description: "",
        frequency: "",
        status: "active",
      });
    }
  }, [open, mode, activity, form]);

  const onSubmit = (values: ActivityFormValues) => {
    onSave(values);
    form.reset();
  };

  const isViewMode = mode === 'view';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            {mode === 'add' && 'Add Activity'}
            {mode === 'edit' && 'Edit Activity'}
            {mode === 'view' && 'View Activity Details'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' && 'Create a new activity for the client.'}
            {mode === 'edit' && 'Update the activity information.'}
            {mode === 'view' && 'View activity details.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter activity name..."
                      {...field}
                      disabled={isViewMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter activity description..."
                      className="min-h-[80px]"
                      {...field}
                      disabled={isViewMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isViewMode}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="as-needed">As Needed</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isViewMode}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                {isViewMode ? 'Close' : 'Cancel'}
              </Button>
              {!isViewMode && (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : mode === 'add' ? "Add Activity" : "Save Changes"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
