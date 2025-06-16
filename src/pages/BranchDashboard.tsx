
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { BookingsTab } from "@/components/bookings/BookingsTab";
import { CarersTab } from "@/components/carers/CarersTab";
import { motion } from "framer-motion";
import { NewBookingDialog } from "@/components/bookings/NewBookingDialog";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/data/hooks/useServices";
import { useBookingData } from "@/components/bookings/hooks/useBookingData";
import { useBookingHandlers } from "@/components/bookings/hooks/useBookingHandlers";

const BranchDashboard = () => {
  const { branchId, branchName } = useParams<{ branchId: string; branchName: string }>();
  const decodedBranchName = branchName ? decodeURIComponent(branchName) : "Branch";
  const { user } = useAuth();
  
  // Booking functionality state and handlers  
  const { clients, carers } = useBookingData(branchId);
  const {
    newBookingDialogOpen,
    setNewBookingDialogOpen,
    handleCreateBooking,
    createMultipleBookingsMutation
  } = useBookingHandlers(branchId, user);
  
  const { data: services = [] } = useServices();

  const handleNewBooking = () => {
    setNewBookingDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      <DashboardNavbar />
      
      <motion.main 
        className="flex-1 px-4 md:px-8 py-6 md:py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <BranchInfoHeader 
          branchId={branchId!} 
          onNewBooking={handleNewBooking}
          showNewBookingButton={true}
        />

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="carers">Carers</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bookings" className="space-y-4">
            <BookingsTab branchId={branchId} branchName={decodedBranchName} />
          </TabsContent>
          
          <TabsContent value="carers" className="space-y-4">
            <CarersTab branchId={branchId} />
          </TabsContent>
          
          <TabsContent value="clients" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Clients Management</h3>
              <p className="text-gray-600">Client management functionality coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Reports & Analytics</h3>
              <p className="text-gray-600">Reports and analytics functionality coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>

        <NewBookingDialog
          open={newBookingDialogOpen}
          onOpenChange={setNewBookingDialogOpen}
          clients={clients}
          carers={carers}
          services={services}
          onCreateBooking={handleCreateBooking}
          isLoading={createMultipleBookingsMutation.isPending}
          error={createMultipleBookingsMutation.error}
        />
      </motion.main>
    </div>
  );
};

export default BranchDashboard;
