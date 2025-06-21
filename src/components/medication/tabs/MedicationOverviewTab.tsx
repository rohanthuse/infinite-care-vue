
import React from "react";
import MedChartData from "@/components/medication/MedChartData";

interface MedicationOverviewTabProps {
  branchId?: string;
}

export const MedicationOverviewTab = ({ branchId }: MedicationOverviewTabProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Medication Analytics</h3>
        <p className="text-muted-foreground text-sm">
          View comprehensive analytics and trends for medication administration.
        </p>
      </div>
      
      <MedChartData viewType="overview" />
    </div>
  );
};
