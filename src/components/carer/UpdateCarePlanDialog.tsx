
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

interface UpdateCarePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: CarePlanUpdateData) => void;
  carePlan: {
    id: string;
    clientName: string;
    status: string;
    type: string;
  };
  patientData: any;
}

// Define the schema for updating care plan
const updateCarePlanSchema = z.object({
  goals: z.array(
    z.object({
      title: z.string().optional(),
      status: z.string().optional(),
      target: z.string().optional(),
      notes: z.string().optional(),
    })
  ).optional(),
  activities: z.array(
    z.object({
      name: z.string().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
      date: z.date().optional(),
    })
  ).optional(),
  notes: z.array(
    z.object({
      content: z.string().min(5, "Note must be at least 5 characters").optional(),
    })
  ).optional(),
  generalNotes: z.string().optional(),
});

export type CarePlanUpdateData = z.infer<typeof updateCarePlanSchema>;

export const UpdateCarePlanDialog: React.FC<UpdateCarePlanDialogProps> = ({
  open,
  onOpenChange,
  onUpdate,
  carePlan,
  patientData,
}) => {
  const form = useForm<CarePlanUpdateData>({
    resolver: zodResolver(updateCarePlanSchema),
    defaultValues: {
      goals: patientData.goals.map(goal => ({
        title: goal.title,
        status: goal.status,
        target: goal.target,
        notes: goal.notes,
      })),
      activities: patientData.activities.map(activity => ({
        name: activity.name,
        status: activity.status,
        notes: activity.notes,
        date: new Date(activity.date),
      })),
      notes: [],
      generalNotes: "",
    },
  });

  const handleUpdate = (data: CarePlanUpdateData) => {
    console.log("Updating care plan with:", data);
    onUpdate(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Care Plan for {carePlan.clientName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-6">
            <Tabs defaultValue="goals" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="goals" className="space-y-4">
                <h3 className="text-lg font-medium">Update Goals</h3>
                {patientData.goals.map((goal, index) => (
                  <div key={index} className="border rounded-md p-4 space-y-3">
                    <FormField
                      control={form.control}
                      name={`goals.${index}.status`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <FormControl>
                            <select
                              className="w-full p-2 border rounded-md"
                              {...field}
                            >
                              <option value="Active">Active</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`goals.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Update notes for this goal"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="activities" className="space-y-4">
                <h3 className="text-lg font-medium">Update Activities</h3>
                {patientData.activities.map((activity, index) => (
                  <div key={index} className="border rounded-md p-4 space-y-3">
                    <FormField
                      control={form.control}
                      name={`activities.${index}.status`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <FormControl>
                            <select
                              className="w-full p-2 border rounded-md"
                              {...field}
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Canceled">Canceled</option>
                            </select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`activities.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Update notes for this activity"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <h3 className="text-lg font-medium">Add New Note</h3>
                <FormField
                  control={form.control}
                  name="generalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Care Note</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a new care note..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Care Plan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
