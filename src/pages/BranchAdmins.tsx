
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable } from "@/components/ParameterTable";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

// Mock data for branch admins
const branchAdminsData = [
  { 
    id: 1, 
    fullName: "Ayo-Famure, Opeyemi", 
    email: "admin@briellehealthcareservices.com", 
    number: "+44 7846427297", 
    branches: "Brielle Health Care Services- Milton Keynes", 
    status: "Active" 
  },
  { 
    id: 2, 
    fullName: "Iyaniwura, Ifeoluwa", 
    email: "ifeoluwa@briellehealthcareservices.com", 
    number: "+44 0744709757", 
    branches: "Brielle Health Care Services- Milton Keynes", 
    status: "Active" 
  },
  { 
    id: 3, 
    fullName: "Abiri-Maitland, Aramide", 
    email: "mide@briellehealthcareservices.com", 
    number: "+44 0772494267", 
    branches: "Brielle Health Care Services- Milton Keynes", 
    status: "Active" 
  },
];

const BranchAdmins = () => {
  const [filteredData, setFilteredData] = useState(branchAdminsData);
  const [showInactive, setShowInactive] = useState(false);
  
  const columns = [
    {
      header: "Full Name",
      accessorKey: "fullName",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[20%]",
    },
    {
      header: "Email",
      accessorKey: "email",
      enableSorting: true,
      className: "text-gray-700 w-[20%]",
    },
    {
      header: "Number",
      accessorKey: "number",
      enableSorting: true,
      className: "text-gray-700 w-[15%]",
    },
    {
      header: "Branches",
      accessorKey: "branches",
      enableSorting: true,
      className: "text-gray-700 w-[30%]",
    },
    {
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      className: "w-[15%]",
      cell: (value: string) => (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800 font-medium border-0 rounded-full px-3">
          {value}
        </Badge>
      ),
    },
  ];
  
  const handleSearch = (query: string) => {
    if (!query) {
      setFilteredData(branchAdminsData);
    } else {
      const filtered = branchAdminsData.filter(item => 
        item.fullName.toLowerCase().includes(query.toLowerCase()) ||
        item.email.toLowerCase().includes(query.toLowerCase()) ||
        item.branches.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };
  
  const filterOptions = [
    {
      name: "showInactive",
      options: [
        { label: "Show Inactive Admins", value: "true" },
        { label: "Hide Inactive Admins", value: "false" },
      ],
      value: showInactive ? "true" : "false",
      onChange: (value: string) => setShowInactive(value === "true"),
    },
  ];
  
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
        <ParameterTable 
          title="Branch Admins"
          icon={<Users className="h-7 w-7 text-blue-600" />}
          columns={columns}
          data={filteredData}
          onSearch={handleSearch}
          searchPlaceholder="Search admins..."
          showFilter={true}
          filterOptions={filterOptions}
        />
      </motion.main>
    </div>
  );
};

export default BranchAdmins;
