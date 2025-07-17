
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { AdminsTable } from "@/components/AdminsTable";
import { AuthHealthDebugger } from "@/components/AuthHealthDebugger";
import { BranchQuickNavigation } from "@/components/dashboard/BranchQuickNavigation";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentUser } = useUserRole();
  
  // The old loading and auth check logic is now handled by the AuthProvider and protected route.
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      <DashboardNavbar />
      
      <motion.main 
        className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Super Admin Branch Navigation */}
        {currentUser?.role === 'super_admin' && <BranchQuickNavigation />}
        
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Branch Administrators</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage and monitor all branch administrators.</p>
          </div>
        </div>

        {/* Removed Workflow section */}
        
        <AdminsTable />
      </motion.main>
      
      {/* Authentication debugging tool for administrators */}
      <AuthHealthDebugger />
    </div>
  );
};

export default Dashboard;
