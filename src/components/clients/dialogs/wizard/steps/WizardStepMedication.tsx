import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Activity } from "lucide-react";  
import { MedicationCalendar } from "@/components/care/medication/MedicationCalendar";
import { MedicationList } from "@/components/care/medication/MedicationList";
import { AddMedicationDialog } from "@/components/care/medication/AddMedicationDialog";
import { MedicationDetailsDialog } from "@/components/care/medication/MedicationDetailsDialog";
import { EditPersistedMedicationDialog } from "@/components/care/medication/EditPersistedMedicationDialog";
import { useMedicationsByCarePlan, useCreateMedication, useDeleteMedication } from "@/hooks/useMedications";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface WizardStepMedicationProps {
  form: UseFormReturn<any>;
  effectiveCarePlanId?: string;
}

export function WizardStepMedication({
  form,
  effectiveCarePlanId
}: WizardStepMedicationProps) {
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Dialog states
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPersistedEditOpen, setIsPersistedEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch existing medications from database if care plan exists
  const { data: existingMedications = [] } = useMedicationsByCarePlan(effectiveCarePlanId || "");
  const createMedicationMutation = useCreateMedication();
  const deleteMedicationMutation = useDeleteMedication();
  
  // Handle saving new medication
  const handleSaveMedication = (medication: any) => {
    // Add to form state temporarily
    const currentMedications = form.getValues("medical_info.medication_manager.medications") || [];
    form.setValue("medical_info.medication_manager.medications", [...currentMedications, medication]);
    
    // If we have a care plan ID, persist to database
    if (effectiveCarePlanId) {
      createMedicationMutation.mutate({
        care_plan_id: effectiveCarePlanId,
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        start_date: medication.start_date,
        end_date: medication.end_date,
        status: medication.status || "active",
        shape: medication.shape || null,
        route: medication.route || null,
        who_administers: medication.who_administers || null,
        level: medication.level || null,
        instruction: medication.instruction || null,
        warning: medication.warning || null,
        side_effect: medication.side_effect || null,
        time_of_day: medication.time_of_day || null
      }, {
        onSuccess: () => {
          // Wait for the query to invalidate and refetch before removing from local state
          // This prevents a race condition where local state is cleared before DB data loads
          queryClient.invalidateQueries({ queryKey: ['medications-by-care-plan', effectiveCarePlanId] }).then(() => {
            // Remove local medication from form state after successful DB save
            // The database version will be fetched via existingMedications query
            const updatedMedications = form.getValues("medical_info.medication_manager.medications") || [];
            const filteredMedications = updatedMedications.filter((med: any) => med.id !== medication.id);
            form.setValue("medical_info.medication_manager.medications", filteredMedications);
            toast.success("Medication added successfully");
          });
        },
        onError: (error) => {
          console.error("Failed to save medication:", error);
          toast.error("Failed to save medication to database");
        }
      });
    } else {
      // No care plan ID yet, just show success for local save
      toast.success("Medication added (will be saved with care plan)");
    }
  };

  // Handle updating local medication
  const handleUpdateMedication = (updatedMedication: any) => {
    const currentMedications = form.getValues("medical_info.medication_manager.medications") || [];
    const updatedMedications = currentMedications.map((med: any) => 
      med.id === updatedMedication.id ? updatedMedication : med
    );
    form.setValue("medical_info.medication_manager.medications", updatedMedications);
    toast.success("Medication updated successfully");
  };

  // Handle list actions
  const handleViewMedication = (medication: any) => {
    setSelectedMedication(medication);
    setIsViewDialogOpen(true);
  };

  const handleEditMedication = (medication: any) => {
    setSelectedMedication(medication);
    const isLocal = medication.id?.startsWith("med-");
    
    if (isLocal) {
      setIsEditDialogOpen(true);
    } else {
      setIsPersistedEditOpen(true);
    }
  };

  const handleDeleteMedication = (medication: any) => {
    setSelectedMedication(medication);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedMedication) return;
    
    const isLocal = selectedMedication.id?.startsWith("med-");
    
    if (isLocal) {
      // Remove from form state
      const currentMedications = form.getValues("medical_info.medication_manager.medications") || [];
      const filteredMedications = currentMedications.filter((med: any) => med.id !== selectedMedication.id);
      form.setValue("medical_info.medication_manager.medications", filteredMedications);
      toast.success("Medication removed successfully");
    } else {
      // Delete from database
      deleteMedicationMutation.mutate(selectedMedication.id, {
        onSuccess: () => {
          toast.success("Medication deleted successfully");
        },
        onError: (error) => {
          console.error("Failed to delete medication:", error);
          toast.error("Failed to delete medication");
        }
      });
    }
    
    setIsDeleteDialogOpen(false);
    setSelectedMedication(null);
  };

  // Get medications from form and database with deduplication
  const formMedications = form.watch("medical_info.medication_manager.medications") || [];
  
  // Deduplicate: Filter out local medications that already exist in database
  const uniqueFormMedications = formMedications.filter((formMed: any) => 
    !existingMedications.some((dbMed: any) => 
      dbMed.name === formMed.name && 
      dbMed.dosage === formMed.dosage &&
      dbMed.frequency === formMed.frequency
    )
  );
  
  const allMedications = [...uniqueFormMedications, ...existingMedications];

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

      {/* Medication Applicable Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="space-y-1">
          <Label htmlFor="medication-applicable" className="text-base font-medium">
            Medication Applicable
          </Label>
          <p className="text-sm text-muted-foreground">
            Toggle off if this client does not receive any medication
          </p>
        </div>
        <Switch
          id="medication-applicable"
          checked={form.watch("medical_info.medication_manager.applicable") ?? true}
          onCheckedChange={(checked) => {
            form.setValue("medical_info.medication_manager.applicable", checked);
          }}
        />
      </div>

      {/* Conditional Medication UI */}
      {form.watch("medical_info.medication_manager.applicable") !== false ? (
        <>
          <MedicationCalendar 
            medications={allMedications}
            onAddMedication={() => setIsAddMedicationOpen(true)}
          />

          <MedicationList
            medications={allMedications}
            onView={handleViewMedication}
            onEdit={handleEditMedication}
            onDelete={handleDeleteMedication}
          />
        </>
      ) : (
        <div className="p-8 text-center border-2 border-dashed rounded-lg bg-muted/20">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Medication Not Applicable
          </h3>
          <p className="text-sm text-muted-foreground">
            This client does not receive any medication. Toggle the switch above if this changes.
          </p>
        </div>
      )}

      <AddMedicationDialog
        isOpen={isAddMedicationOpen}
        onClose={() => setIsAddMedicationOpen(false)}
        onSave={handleSaveMedication}
      />

      <AddMedicationDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedMedication(null);
        }}
        onUpdate={handleUpdateMedication}
        mode="edit"
        initialMedication={selectedMedication}
      />

      <MedicationDetailsDialog
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setSelectedMedication(null);
        }}
        medication={selectedMedication}
      />

      <EditPersistedMedicationDialog
        isOpen={isPersistedEditOpen}
        onClose={() => {
          setIsPersistedEditOpen(false);
          setSelectedMedication(null);
        }}
        medication={selectedMedication}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedMedication?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMedication(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}