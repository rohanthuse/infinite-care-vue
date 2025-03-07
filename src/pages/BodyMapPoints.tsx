import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable } from "@/components/ParameterTable";
import { ActivitySquare } from "lucide-react";
import { motion } from "framer-motion";
import { AddBodyMapPointDialog } from "@/components/AddBodyMapPointDialog";

// Mock data for body map points
const bodyMapPointsData = [
  { id: 1, letter: "A", title: "Scalds, burns", color: "#ff00ff" },
  { id: 2, letter: "B", title: "Bruising", color: "#00ff80" },
  { id: 3, letter: "C", title: "Excoriation, red areas (not broken down)", color: "#ff0000" },
  { id: 4, letter: "D", title: "Cuts, wounds", color: "#ff8000" },
];

const BodyMapPoints = () => {
  const [points, setPoints] = useState(bodyMapPointsData);
  const [filteredData, setFilteredData] = useState(points);
  const [searchQuery, setSearchQuery] = useState("");
  
  const columns = [
    {
      header: "Letter",
      accessorKey: "letter",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[15%]",
    },
    {
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[65%]",
    },
    {
      header: "Colour",
      accessorKey: "color",
      enableSorting: false,
      className: "w-[20%]",
      cell: (value: string) => (
        <div 
          className="h-6 w-12 rounded"
          style={{ backgroundColor: value }}
        ></div>
      ),
    },
  ];
  
  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, points]);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredData(points);
    } else {
      const filtered = points.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.letter.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };

  const handleAddBodyMapPoint = (newPoint: { letter: string; title: string; color: string }) => {
    const newPointWithId = {
      id: points.length + 1,
      ...newPoint
    };
    
    const updatedPoints = [...points, newPointWithId];
    setPoints(updatedPoints);
    setFilteredData(!searchQuery ? updatedPoints : filteredData);
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
          title="Body Map Points"
          icon={<ActivitySquare className="h-7 w-7 text-blue-600" />}
          columns={columns}
          data={filteredData}
          onSearch={handleSearch}
          searchPlaceholder="Search body map points..."
          hasColorColumn={true}
          addButton={<AddBodyMapPointDialog onAdd={handleAddBodyMapPoint} />}
        />
      </motion.main>
    </div>
  );
};

export default BodyMapPoints;
