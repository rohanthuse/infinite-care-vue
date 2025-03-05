
import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable } from "@/components/ParameterTable";
import { Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AddBranchDialog } from "@/components/AddBranchDialog";

// Mock data for branches
const branchData = [
  { 
    id: 1, 
    title: "Med-Infinite Health Care Services- Milton Keynes", 
    country: "England", 
    currency: "£", 
    regulatory: "CQC", 
    branchType: "HomeCare", 
    createdOn: "01/01/0001", 
    createdBy: "", 
    status: "Active" 
  },
  { 
    id: 2, 
    title: "Med-Infinite Health Care Services- Hampshire", 
    country: "England", 
    currency: "£", 
    regulatory: "CQC", 
    branchType: "HomeCare", 
    createdOn: "06/01/2025", 
    createdBy: "Laniyan, Aderinsola", 
    status: "Active" 
  },
];

const Branch = () => {
  const [branches, setBranches] = useState(branchData);
  const [filteredData, setFilteredData] = useState(branches);
  const [searchQuery, setSearchQuery] = useState("");
  
  const columns = [
    {
      header: "#",
      accessorKey: "id",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[5%]",
    },
    {
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[25%]",
    },
    {
      header: "Country",
      accessorKey: "country",
      enableSorting: true,
      className: "text-gray-700 w-[10%]",
    },
    {
      header: "Currency",
      accessorKey: "currency",
      enableSorting: true,
      className: "text-gray-700 w-[10%]",
    },
    {
      header: "Regulatory",
      accessorKey: "regulatory",
      enableSorting: true,
      className: "text-gray-700 w-[10%]",
    },
    {
      header: "Branch Type",
      accessorKey: "branchType",
      enableSorting: true,
      className: "text-gray-700 w-[10%]",
    },
    {
      header: "Created On",
      accessorKey: "createdOn",
      enableSorting: true,
      className: "text-gray-700 w-[10%]",
    },
    {
      header: "Created By",
      accessorKey: "createdBy",
      enableSorting: true,
      className: "text-gray-700 w-[10%]",
    },
    {
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      className: "w-[10%]",
      cell: (value: string) => (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800 font-medium border-0 rounded-full px-3">
          {value}
        </Badge>
      ),
    },
  ];
  
  // Update search whenever query changes
  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, branches]);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredData(branches);
    } else {
      const filtered = branches.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.country.toLowerCase().includes(query.toLowerCase()) ||
        item.branchType.toLowerCase().includes(query.toLowerCase()) ||
        item.regulatory.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };
  
  const handleAddBranch = (newBranch: {
    title: string;
    country: string;
    currency: string;
    regulatory: string;
    branchType: string;
    status: string;
  }) => {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
    
    const newBranchWithId = {
      id: branches.length + 1,
      ...newBranch,
      createdOn: formattedDate,
      createdBy: "Admin User"
    };
    
    const updatedBranches = [...branches, newBranchWithId];
    setBranches(updatedBranches);
    setFilteredData(updatedBranches);
  };
  
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
          title="Branch"
          icon={<Building2 className="h-7 w-7 text-blue-600" />}
          columns={columns}
          data={filteredData}
          onSearch={handleSearch}
          searchPlaceholder="Search branches..."
          addButton={<AddBranchDialog onAdd={handleAddBranch} />}
        />
      </motion.main>
    </div>
  );
};

export default Branch;
