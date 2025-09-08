import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Activity } from "lucide-react";
import { MedicationCalendar } from "@/components/care/medication/MedicationCalendar";
import { AddMedicationDialog } from "@/components/care/medication/AddMedicationDialog";
import { useMedicationsByCarePlan, useCreateMedication } from "@/hooks/useMedications";
import { toast } from "sonner";

interface WizardStepMedicationProps {
  form: UseFormReturn<any>;
  effectiveCarePlanId?: string;
}

export function WizardStepMedication({
  form,
  effectiveCarePlanId
}: WizardStepMedicationProps) {
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);
  
  // Fetch existing medications from database if care plan exists
  const { data: existingMedications = [] } = useMedicationsByCarePlan(effectiveCarePlanId || "");
  const createMedicationMutation = useCreateMedication();
  
  // Handle saving new medication
  const handleSaveMedication = (medication: any) => {
    // Add to form state
    const currentMedications = form.getValues("medical_info.medication_manager.medications") || [];
    form.setValue("medical_info.medication_manager.medications", [...currentMedications, medication]);
    
    // If we have a care plan ID, also persist to database
    if (effectiveCarePlanId) {
      createMedicationMutation.mutate({
        care_plan_id: effectiveCarePlanId,
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        start_date: medication.start_date,
        end_date: medication.end_date,
        status: medication.status || "active"
      }, {
        onSuccess: () => {
          toast.success("Medication added successfully");
        },
        onError: (error) => {
          console.error("Failed to save medication:", error);
          toast.error("Failed to save medication to database");
        }
      });
    }
  };

  // Get medications from form and database
  const formMedications = form.watch("medical_info.medication_manager.medications") || [];
  const allMedications = [...formMedications, ...existingMedications];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Medication
        </h2>
        <p className="text-gray-600">
          Manage client medications and view them on the calendar.
        </p>
      </div>

      <MedicationCalendar 
        medications={allMedications}
        onAddMedication={() => setIsAddMedicationOpen(true)}
      />

      <AddMedicationDialog
        isOpen={isAddMedicationOpen}
        onClose={() => setIsAddMedicationOpen(false)}
        onSave={handleSaveMedication}
      />
    </div>
  );
}