
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { AdminsTable } from "@/components/AdminsTable";
import { AuthHealthDebugger } from "@/components/AuthHealthDebugger";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

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
      
      {/* Authentication debugging tool for administrators */}
      <AuthHealthDebugger />
    </div>
  );
};

export default BranchAdmins;
