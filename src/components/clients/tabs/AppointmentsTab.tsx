
import React from "react";
import { BookingTimeGrid } from "@/components/bookings/BookingTimeGrid";
import { useBranchCarers } from "@/data/hooks/useBranchCarers";

interface AppointmentsTabProps {
  clientId: string;
  branchId?: string;
}

export function AppointmentsTab({ clientId, branchId }: AppointmentsTabProps) {
  const { data: carersData = [], isLoading: isLoadingCarers } = useBranchCarers(branchId);
  
  // Transform carer data to match expected format
  const carers = carersData.map(carer => ({
    id: carer.id,
    name: `${carer.first_name} ${carer.last_name}`.trim(),
  }));

  if (isLoadingCarers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BookingTimeGrid
        selectedDate={new Date()}
        branchId={branchId}
        className="mt-0"
      />
    </div>
  );
}
