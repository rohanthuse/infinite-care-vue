
import React from "react";
import { DataTable } from "@/components/ui/data-table";
import { MedicationTableColumns } from "@/components/medication/MedicationTableColumns";
import { usePendingMedications } from "@/hooks/useMedicationAdministration";

interface PendingMedicationsTabProps {
  branchId?: string;
}

export const PendingMedicationsTab = ({ branchId }: PendingMedicationsTabProps) => {
  const { data: medications = [] } = usePendingMedications(branchId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Pending Medications</h3>
        <p className="text-muted-foreground text-sm">
          Medications that require administration today.
        </p>
      </div>
      
      <DataTable columns={MedicationTableColumns} data={medications} />
    </div>
  );
};
