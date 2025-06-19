
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
