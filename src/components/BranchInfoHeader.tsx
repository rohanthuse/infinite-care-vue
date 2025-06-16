
import React from "react";
import { Phone, Mail, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewBookingDialog } from "./bookings/NewBookingDialog";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/data/hooks/useServices";
import { useBookingData } from "./bookings/hooks/useBookingData";
import { useBookingHandlers } from "./bookings/hooks/useBookingHandlers";

interface BranchInfoHeaderProps {
  branchName: string;
  branchId: string;
}

export const BranchInfoHeader = ({
  branchName,
  branchId
}: BranchInfoHeaderProps) => {
  const { user } = useAuth();
  
  // Use the same hooks as BookingsTab for complete integration
  const { clients, carers, isLoading: isLoadingData } = useBookingData(branchId);
  const {
    newBookingDialogOpen,
    setNewBookingDialogOpen,
    newBookingData,
    handleNewBooking,
    handleCreateBooking,
    createMultipleBookingsMutation
  } = useBookingHandlers(branchId, user);
  
  // Add service fetching
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useServices();

  // These would typically come from an API call based on branchId
  // For now, we'll use static mock data
  const branchInfo = {
    status: "Active",
    address: "Milton Keynes, MK9 3NZ",
    phone: "+44 20 7946 0587",
    email: "milton@med-infinite.com",
    operatingHours: "Mon-Fri: 8:00 - 18:00",
    establishedDate: "Est. 2020"
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-xl md:text-2xl font-bold">{branchName}</h1>
              <Badge variant="success" className="text-xs">
                {branchInfo.status}
              </Badge>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gray-500" />
                <span>{branchInfo.address}</span>
              </div>
              <div className="hidden md:flex items-center text-gray-300">|</div>
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-gray-500" />
                <span>{branchInfo.phone}</span>
              </div>
              <div className="hidden md:flex items-center text-gray-300">|</div>
              <div className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-gray-500" />
                <span>{branchInfo.email}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-start md:justify-end">
            <Button
              onClick={handleNewBooking}
              variant="default"
              className="h-9 bg-blue-600 hover:bg-blue-700 rounded-full px-3 shadow-sm"
              disabled={!user || isLoadingData}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>New Booking</span>
            </Button>
          </div>
        </div>
      </div>

      <NewBookingDialog
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        clients={clients}
        carers={carers}
        services={services}
        onCreateBooking={handleCreateBooking}
        initialData={newBookingData}
        isLoading={createMultipleBookingsMutation.isPending}
        error={createMultipleBookingsMutation.error}
        servicesLoading={servicesLoading}
        servicesError={servicesError}
      />
    </>
  );
};
