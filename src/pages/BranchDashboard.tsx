
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Routes, Route, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchSidebar } from "@/components/BranchSidebar";
import { ModuleNavigation } from "@/components/ModuleNavigation";
import { ModuleContent, TabNavigation } from "@/components/TabNavigation";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { BookingsTab } from "@/components/bookings/BookingsTab";
import { CarersTab } from "@/components/carers/CarersTab";
import { CommunicationsTab } from "@/components/communications/CommunicationsTab";
import { ReviewsTab } from "@/components/reviews/ReviewsTab";

const BranchDashboard = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeModule, setActiveModule] = useState("dashboard");
  
  // Extract the current module from the URL
  useEffect(() => {
    const path = location.pathname;
    const pathParts = path.split('/');
    // Assuming the module is the 5th part of the path (0-indexed)
    if (pathParts.length >= 5) {
      setActiveModule(pathParts[4]);
    } else {
      // Default to dashboard if no module is specified
      setActiveModule("dashboard");
    }
  }, [location.pathname]);
  
  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    navigate(`/branch-dashboard/${id}/${branchName}/${module}`);
  };
  
  const decodedBranchName = decodeURIComponent(branchName || "");
  
  // Calculate main content area offset
  const contentOffset = "md:ml-[280px]";
  
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <BranchSidebar branchName={decodedBranchName} />
      
      <main className={cn("pt-[4.5rem] pb-20 transition-all duration-300", contentOffset)}>
        <div className="container max-w-7xl mx-auto px-4">
          <div className="py-6">
            <ModuleNavigation activeModule={activeModule} onModuleChange={handleModuleChange} />
            <TabNavigation activeTab={activeModule} onChange={handleModuleChange} />
            
            <Routes>
              <Route path="/dashboard" element={
                <ModuleContent 
                  title="Branch Dashboard" 
                  description={`Overview of ${decodedBranchName}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold mb-2">Recent Activities</h3>
                      <p className="text-gray-500">No recent activities</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold mb-2">Stats</h3>
                      <p className="text-gray-500">No stats available</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold mb-2">Tasks</h3>
                      <p className="text-gray-500">No pending tasks</p>
                    </div>
                  </div>
                </ModuleContent>
              } />
              <Route path="/bookings/*" element={<BookingsTab />} />
              <Route path="/clients" element={
                <ModuleContent title="Clients">
                  <p>Client management module coming soon.</p>
                </ModuleContent>
              } />
              <Route path="/carers/*" element={<CarersTab />} />
              <Route path="/reviews" element={<ReviewsTab />} />
              <Route path="/workflow" element={
                <iframe 
                  src={`/workflow`} 
                  className="w-full h-[calc(100vh-200px)] border-none"
                  title="Workflow"
                />
              } />
              <Route path="/communication" element={<CommunicationsTab />} />
              <Route path="/key-parameters" element={
                <iframe 
                  src={`/key-parameters`} 
                  className="w-full h-[calc(100vh-200px)] border-none"
                  title="Key Parameters"
                />
              } />
              <Route path="*" element={
                <ModuleContent title="Coming Soon">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <p className="text-gray-500">This module is under development.</p>
                  </div>
                </ModuleContent>
              } />
            </Routes>
          </div>
        </div>
      </main>
      
      <Toaster position="top-right" />
    </div>
  );
};

export default BranchDashboard;
