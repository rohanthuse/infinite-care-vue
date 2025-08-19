
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NewBookingDialog } from "@/components/bookings/dialogs/NewBookingDialog";
import { useToast } from "@/hooks/use-toast";
import { useBranchCarers } from "@/data/hooks/useBranchCarers";
import { useServices } from "@/data/hooks/useServices";

export default function BranchDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const [selectedBranchId] = useState<string | undefined>(undefined);

  const { data: services = [] } = useServices();
  const { data: carersData = [] } = useBranchCarers(selectedBranchId);

  // Transform carer data to match expected format
  const carers = carersData.map(carer => ({
    id: carer.id,
    name: `${carer.first_name} ${carer.last_name}`.trim(),
    initials: `${carer.first_name?.charAt(0) || ''}${carer.last_name?.charAt(0) || ''}`.toUpperCase(),
  }));

  const handleCreateBooking = (bookingData: any) => {
    console.log('Creating booking:', bookingData);
    setNewBookingDialogOpen(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Please log in to access the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold">Branch Dashboard</h1>
          <p>Welcome to your branch dashboard. Manage your services, clients, and bookings here.</p>

          <button 
            onClick={() => setNewBookingDialogOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Create Booking
          </button>

          <NewBookingDialog
            open={newBookingDialogOpen}
            onOpenChange={setNewBookingDialogOpen}
            carers={carers}
            services={services}
            onCreateBooking={handleCreateBooking}
          />
        </div>
      </main>
    </div>
  );
}
