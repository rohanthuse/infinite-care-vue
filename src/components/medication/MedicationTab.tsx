
import React, { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { MedicationTableColumns } from "@/components/medication/MedicationTableColumns";
import { AddMedicationDialog } from "@/components/medication/AddMedicationDialog";
import { usePendingMedications } from "@/hooks/useMedicationAdministration";
import { useBranchDashboardNavigation } from "@/hooks/useBranchDashboardNavigation";
import MedChartData from "@/components/medication/MedChartData";

interface MedicationTabProps {
  branchId?: string;
  branchName?: string;
}

export const MedicationTab = ({ branchId: propBranchId, branchName }: MedicationTabProps) => {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [open, setOpen] = React.useState(false);
  const { id: navBranchId } = useBranchDashboardNavigation();
  
  // Use prop branchId if provided, otherwise fall back to navigation branchId
  const branchId = propBranchId || navBranchId;
  
  const { data: medications = [], refetch } = usePendingMedications(branchId);

  return (
    <div className="space-y-6">
      {/* Charts Section - Now uses real data */}
      <MedChartData viewType="overview" />
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Medication Overview</h2>
          <p className="text-muted-foreground">
            Here's an overview of all medications and their administration.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={
                  "w-[300px] justify-start text-left font-normal" +
                  (!date
                    ? "text-muted-foreground"
                    : "text-foreground")
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    `${format(date.from, "MMM dd, yyyy")} - ${format(
                      date.to,
                      "MMM dd, yyyy"
                    )}`
                  ) : (
                    format(date.from, "MMM dd, yyyy")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="end"
            >
              <Calendar
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={() => setOpen(true)}>Add Medication</Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Medications</TabsTrigger>
          <TabsTrigger value="all">All Medications</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <DataTable columns={MedicationTableColumns} data={medications} />
        </TabsContent>
        <TabsContent value="all">
          <DataTable columns={MedicationTableColumns} data={medications} />
        </TabsContent>
      </Tabs>

      <AddMedicationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
};
