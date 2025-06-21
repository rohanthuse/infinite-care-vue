
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
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mar-overview">MAR Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending Medications</TabsTrigger>
          <TabsTrigger value="all">All Medications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Total Medications</h3>
                <p className="text-3xl font-bold text-blue-600">{medications.length}</p>
                <p className="text-sm text-muted-foreground">Active prescriptions</p>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Pending Today</h3>
                <p className="text-3xl font-bold text-orange-600">{medications.filter(med => med.administration_status === 'pending').length}</p>
                <p className="text-sm text-muted-foreground">Require administration</p>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Administered</h3>
                <p className="text-3xl font-bold text-green-600">{medications.filter(med => med.administration_status === 'given').length}</p>
                <p className="text-sm text-muted-foreground">Completed today</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mar-overview">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">MAR Overview</h2>
              <p className="text-muted-foreground">
                Medication Administration Record charts and analytics.
              </p>
            </div>
            <MedChartData viewType="overview" />
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Pending Medications</h2>
              <p className="text-muted-foreground">
                Medications that require administration today.
              </p>
            </div>
            <DataTable columns={MedicationTableColumns} data={medications.filter(med => med.administration_status === 'pending')} />
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">All Medications</h2>
              <p className="text-muted-foreground">
                Complete list of all active medications.
              </p>
            </div>
            <DataTable columns={MedicationTableColumns} data={medications} />
          </div>
        </TabsContent>
      </Tabs>

      <AddMedicationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
};
