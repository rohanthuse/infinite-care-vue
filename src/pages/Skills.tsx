import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable } from "@/components/ParameterTable";
import { Brain } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AddSkillDialog } from "@/components/AddSkillDialog";

// Mock data for skills
const skillsData = [
  { id: 1, name: "Patience", explanation: "", status: "Active" },
  { id: 2, name: "Pleasant", explanation: "", status: "Active" },
  { id: 3, name: "Friendly", explanation: "", status: "Active" },
  { id: 4, name: "Personable", explanation: "", status: "Active" },
  { id: 5, name: "Cheerful", explanation: "", status: "Active" },
  { id: 6, name: "Ability to multi-task", explanation: "", status: "Active" },
  { id: 7, name: "Ability to think quickly", explanation: "", status: "Active" },
  { id: 8, name: "Punctual", explanation: "", status: "Active" },
  { id: 9, name: "A good listener", explanation: "", status: "Active" },
  { id: 10, name: "Empathetic", explanation: "", status: "Active" },
  { id: 11, name: "Kind", explanation: "", status: "Active" },
  { id: 12, name: "Ability to take responsibility", explanation: "", status: "Active" },
  { id: 13, name: "Willingness to go the extra mile", explanation: "", status: "Active" },
  { id: 14, name: "Knowledge of dementia", explanation: "", status: "Active" },
  { id: 15, name: "Communication skills", explanation: "", status: "Active" },
];

const Skills = () => {
  const [skills, setSkills] = useState(skillsData);
  const [filteredData, setFilteredData] = useState(skills);
  const [searchQuery, setSearchQuery] = useState("");
  
  const columns = [
    {
      header: "Skill Name",
      accessorKey: "name",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[40%]",
    },
    {
      header: "Skill Explanation",
      accessorKey: "explanation",
      enableSorting: false,
      className: "text-gray-700 w-[40%]",
    },
    {
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      className: "w-[20%]",
      cell: (value: string) => (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800 font-medium border-0 rounded-full px-3">
          {value}
        </Badge>
      ),
    },
  ];
  
  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, skills]);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredData(skills);
    } else {
      const filtered = skills.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.explanation && item.explanation.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredData(filtered);
    }
  };
  
  const handleAddSkill = (newSkill: { name: string; explanation: string; status: string }) => {
    const newSkillWithId = {
      id: skills.length + 1,
      ...newSkill
    };
    
    const updatedSkills = [...skills, newSkillWithId];
    setSkills(updatedSkills);
    setFilteredData(!searchQuery ? updatedSkills : filteredData);
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
          title="Skills"
          icon={<Brain className="h-7 w-7 text-blue-600" />}
          columns={columns}
          data={filteredData}
          onSearch={handleSearch}
          searchPlaceholder="Search skills..."
          addButton={<AddSkillDialog onAdd={handleAddSkill} />}
        />
      </motion.main>
    </div>
  );
};

export default Skills;
