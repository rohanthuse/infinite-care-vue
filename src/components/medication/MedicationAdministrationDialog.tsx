
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock, User } from "lucide-react";
import { useRecordMedicationAdministration } from "@/hooks/useMedicationAdministration";
import { format } from "date-fns";

interface MedicationAdministrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication?: {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    client_care_plans?: {
      clients?: {
        first_name: string;
        last_name: string;
      };
    };
  };
}

const formSchema = z.object({
  status: z.enum(['given', 'refused', 'not_given', 'not_applicable'], {
    required_error: "Administration status is required.",
  }),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export const MedicationAdministrationDialog = ({ 
  open, 
  onOpenChange, 
  medication 
}: MedicationAdministrationDialogProps) => {
  const recordAdministration = useRecordMedicationAdministration();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "given",
      notes: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    if (!medication) return;

    try {
      await recordAdministration.mutateAsync({
        medication_id: medication.id,
        administered_at: new Date().toISOString(),
        status: values.status,
        notes: values.notes || undefined,
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error recording medication administration:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "given":
        return "bg-green-100 text-green-800 border-green-200";
      case "refused":
        return "bg-red-100 text-red-800 border-red-200";
      case "not_given":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "not_applicable":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "given":
        return "Given";
      case "refused":
        return "Refused by Patient";
      case "not_given":
        return "Not Given";
      case "not_applicable":
        return "Not Applicable";
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <Pill className="h-5 w-5 mr-2 text-blue-600" />
            Record Medication Administration
          </DialogTitle>
        </DialogHeader>

        {medication && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{medication.name}</h3>
                <p className="text-gray-600 text-sm">{medication.dosage}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{medication.frequency}</span>
                </div>
                {medication.client_care_plans?.clients && (
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {medication.client_care_plans.clients.first_name} {medication.client_care_plans.clients.last_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Administration Time: {format(new Date(), 'PPpp')}
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Administration Status*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select administration status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        { value: "given", label: "Given" },
                        { value: "refused", label: "Refused by Patient" },
                        { value: "not_given", label: "Not Given" },
                        { value: "not_applicable", label: "Not Applicable" },
                      ].map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(option.value)}>
                              {option.label}
                            </Badge>
                          </div>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about the administration..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={recordAdministration.isPending}>
                {recordAdministration.isPending ? "Recording..." : "Record Administration"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
