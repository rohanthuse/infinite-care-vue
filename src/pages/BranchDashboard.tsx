
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { BookingsTab } from "@/components/bookings/BookingsTab";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BranchDashboard = () => {
  const { id, name } = useParams<{ id: string; name: string }>();
  const decodedName = name ? decodeURIComponent(name) : "Branch";
  const [activeTab, setActiveTab] = useState("bookings");

  if (!id) {
    return <div>Branch ID not found</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      <DashboardNavbar />
      
      <motion.main 
        className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <BranchInfoHeader branchName={decodedName} branchId={id} />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-lg">
            <TabsTrigger 
              value="bookings" 
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              Bookings
            </TabsTrigger>
            <TabsTrigger 
              value="staff" 
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              Staff
            </TabsTrigger>
            <TabsTrigger 
              value="clients" 
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              Clients
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <BookingsTab branchId={id} branchName={decodedName} />
          </TabsContent>
          
          <TabsContent value="staff">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Staff Management</h2>
              <p className="text-gray-500">Staff management functionality will be implemented here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="clients">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Client Management</h2>
              <p className="text-gray-500">Client management functionality will be implemented here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="reports">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Reports</h2>
              <p className="text-gray-500">Reports functionality will be implemented here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </motion.main>
    </div>
  );
};

export default BranchDashboard;
