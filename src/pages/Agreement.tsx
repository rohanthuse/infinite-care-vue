
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { AgreementList } from "@/components/AgreementList";
import { FileText } from "lucide-react";
import { motion } from "framer-motion";

const Agreement = () => {
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
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Agreements</h1>
        </div>
        
        <AgreementList />
      </motion.main>
    </div>
  );
};

export default Agreement;
