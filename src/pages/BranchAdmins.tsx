
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { AdminsTable } from "@/components/AdminsTable";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

const BranchAdmins = () => {
  const [activeTab, setActiveTab] = useState("branchAdmins"); // Set the active tab
  const navigate = useNavigate();

  const handleNavigationChange = (value: string) => {
    if (value === "dashboard") {
      navigate("/dashboard");
    } else if (value === "task-matrix" || value === "training-matrix" || value === "form-matrix" || value === "medication") {
      navigate(`/workflow/${value}`);
    } else if (value === "workflow") {
      navigate("/workflow/task-matrix");
    } else {
      navigate(`/${value}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      <TabNavigation activeTab={activeTab} onChange={handleNavigationChange} />
      
      <motion.main 
        className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Branch Admins</h1>
                <p className="text-gray-500 text-sm md:text-base">Manage administrators for each branch location</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
          <AdminsTable />
        </div>
      </motion.main>
    </div>
  );
};

export default BranchAdmins;
