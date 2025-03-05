
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable } from "@/components/ParameterTable";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

// Mock data for hobbies
const hobbiesData = [
  { id: 1, title: "Listening to Music", status: "Active" },
  { id: 2, title: "Swimming", status: "Active" },
  { id: 3, title: "Reading", status: "Active" },
  { id: 4, title: "Playing Musical Instruments", status: "Active" },
  { id: 5, title: "Dancing", status: "Active" },
  { id: 6, title: "Walking", status: "Active" },
  { id: 7, title: "Yoga", status: "Active" },
  { id: 8, title: "Cooking", status: "Active" },
  { id: 9, title: "Knitting", status: "Active" },
  { id: 10, title: "Fishing", status: "Active" },
  { id: 11, title: "Fishkeeping", status: "Active" },
  { id: 12, title: "Photography", status: "Active" },
  { id: 13, title: "Mountaineering", status: "Active" },
  { id: 14, title: "Watching TV", status: "Active" },
  { id: 15, title: "Painting", status: "Active" },
  { id: 16, title: "Gardening", status: "Active" },
];

const Hobbies = () => {
  const [filteredData, setFilteredData] = useState(hobbiesData);
  
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
      setFilteredData(hobbiesData);
    } else {
      const filtered = hobbiesData.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered);
    }
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
          title="Hobbies"
          icon={<Heart className="h-7 w-7 text-blue-600" />}
          columns={columns}
          data={filteredData}
          onSearch={handleSearch}
          searchPlaceholder="Search hobbies..."
        />
      </motion.main>
    </div>
  );
};

export default Hobbies;
