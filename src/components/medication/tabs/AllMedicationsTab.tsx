
import React from "react";
import { DataTable } from "@/components/ui/data-table";
import { MedicationTableColumns } from "@/components/medication/MedicationTableColumns";
import { useMedicationsByBranch } from "@/hooks/useMedications";

interface AllMedicationsTabProps {
  branchId?: string;
}

export const AllMedicationsTab = ({ branchId }: AllMedicationsTabProps) => {
  const { data: medications = [] } = useMedicationsByBranch(branchId || '');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">All Medications</h3>
        <p className="text-muted-foreground text-sm">
          Complete list of all medications for this branch.
        </p>
      </div>
      
      <DataTable columns={MedicationTableColumns} data={medications} />
    </div>
  );
};
