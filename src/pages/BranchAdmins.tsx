
import React from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { AdminsTable } from "@/components/AdminsTable";

const BranchAdmins = () => {
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
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Users className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Branch Admins</h1>
          </div>
          <p className="text-gray-500">Manage administrators for each branch location</p>
        </div>
        
        <AdminsTable />
      </motion.main>
    </div>
  );
};

export default BranchAdmins;
