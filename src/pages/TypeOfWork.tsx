
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable } from "@/components/ParameterTable";
import { Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AddWorkTypeDialog } from "@/components/AddWorkTypeDialog";

// Mock data for type of work
const typeOfWorkData = [
  { id: 1, title: "Night Shift", status: "Active" },
  { id: 2, title: "Companionship", status: "Active" },
  { id: 3, title: "Personal Care", status: "Active" },
  { id: 4, title: "Manual Handling", status: "Active" },
  { id: 5, title: "Weekend Work", status: "Active" },
  { id: 6, title: "Bank Holiday Work", status: "Active" },
  { id: 7, title: "Medication Support", status: "Active" },
  { id: 8, title: "Respite for Carers", status: "Active" },
  { id: 9, title: "Learning Disability Support", status: "Active" },
  { id: 10, title: "Dementia Support", status: "Active" },
  { id: 11, title: "Urgent Responder", status: "Active" },
  { id: 12, title: "Fall Responder", status: "Active" },
  { id: 13, title: "Clients' Transport", status: "Active" },
  { id: 14, title: "Home Help", status: "Active" },
  { id: 15, title: "Meal Preparation", status: "Active" },
  { id: 16, title: "Shopping", status: "Active" },
];

const TypeOfWork = () => {
  const [workTypes, setWorkTypes] = useState(typeOfWorkData);
  const [filteredData, setFilteredData] = useState(workTypes);
  
  const columns = [
    {
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[60%]",
    },
    {
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      className: "w-[40%]",
      cell: (value: string) => (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800 font-medium border-0 rounded-full px-3">
          {value}
        </Badge>
      ),
    },
  ];
  
  const handleSearch = (query: string) => {
    if (!query) {
      setFilteredData(workTypes);
    } else {
      const filtered = workTypes.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };
  
  const handleAddWorkType = (newWorkType: { title: string; status: string }) => {
    const newWorkTypeWithId = {
      id: workTypes.length + 1,
      ...newWorkType
    };
    
    const updatedWorkTypes = [...workTypes, newWorkTypeWithId];
    setWorkTypes(updatedWorkTypes);
    setFilteredData(updatedWorkTypes);
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
          title="Type of Work"
          icon={<Briefcase className="h-7 w-7 text-blue-600" />}
          columns={columns}
          data={filteredData}
          onSearch={handleSearch}
          searchPlaceholder="Search work types..."
          addButton={<AddWorkTypeDialog onAdd={handleAddWorkType} />}
        />
      </motion.main>
    </div>
  );
};

export default TypeOfWork;
