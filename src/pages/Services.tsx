
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ServicesTable } from "@/components/ServicesTable";
import { motion } from "framer-motion";
import { Briefcase, Plus, Search, Filter, Download } from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import { Input } from "@/components/ui/input";

const Services = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
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
                <Briefcase className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Services</h1>
                <p className="text-gray-500 text-sm md:text-base">Manage client service offerings</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-9 bg-white border-gray-200 focus:border-blue-300 w-full sm:w-64" 
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <CustomButton 
                variant="pill" 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Service
              </CustomButton>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>Filter options</span>
            </div>
            
            <CustomButton 
              variant="outline" 
              size="sm"
              className="text-gray-600 border-gray-200 hover:bg-gray-50"
            >
              <Download className="mr-1.5 h-4 w-4" /> Export
            </CustomButton>
          </div>
          
          <ServicesTable />
        </div>
      </motion.main>
    </div>
  );
};

export default Services;
