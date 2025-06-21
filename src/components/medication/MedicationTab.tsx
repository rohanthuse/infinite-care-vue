
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddMedicationDialog } from "@/components/medication/AddMedicationDialog";
import { useBranchDashboardNavigation } from "@/hooks/useBranchDashboardNavigation";

// Import tab components
import { MedicationOverviewTab } from "@/components/medication/tabs/MedicationOverviewTab";
import { PendingMedicationsTab } from "@/components/medication/tabs/PendingMedicationsTab";
import { AllMedicationsTab } from "@/components/medication/tabs/AllMedicationsTab";
import { AdministrationRecordsTab } from "@/components/medication/tabs/AdministrationRecordsTab";
import { MedicationReportsTab } from "@/components/medication/tabs/MedicationReportsTab";

interface MedicationTabProps {
  branchId?: string;
  branchName?: string;
}

export const MedicationTab = ({ branchId: propBranchId, branchName }: MedicationTabProps) => {
  const [open, setOpen] = useState(false);
  const { id: navBranchId } = useBranchDashboardNavigation();
  
  // Use prop branchId if provided, otherwise fall back to navigation branchId
  const branchId = propBranchId || navBranchId;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Medication Management</h2>
          <p className="text-muted-foreground">
            Comprehensive medication administration and monitoring system.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          Add Medication
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="all">All Medications</TabsTrigger>
          <TabsTrigger value="records">Administration Records</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <MedicationOverviewTab branchId={branchId} />
        </TabsContent>
        
        <TabsContent value="pending">
          <PendingMedicationsTab branchId={branchId} />
        </TabsContent>
        
        <TabsContent value="all">
          <AllMedicationsTab branchId={branchId} />
        </TabsContent>
        
        <TabsContent value="records">
          <AdministrationRecordsTab branchId={branchId} />
        </TabsContent>
        
        <TabsContent value="reports">
          <MedicationReportsTab branchId={branchId} />
        </TabsContent>
      </Tabs>

      <AddMedicationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
};
