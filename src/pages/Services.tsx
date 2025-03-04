
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ServicesTable } from "@/components/ServicesTable";
import { motion } from "framer-motion";
import { Briefcase, Plus } from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";

const Services = () => {
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
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Services</h1>
          </div>
          
          <CustomButton 
            variant="pill" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-5 w-5" /> New
          </CustomButton>
        </div>
        
        <ServicesTable />
      </motion.main>
    </div>
  );
};

export default Services;
