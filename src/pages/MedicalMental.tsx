import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable } from "@/components/ParameterTable";
import { Stethoscope, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddMedicalConditionDialog } from "@/components/AddMedicalConditionDialog";
import { CustomButton } from "@/components/ui/CustomButton";

// Mock data for medical conditions
const conditionsData = [
  { id: 1, title: "Cancer", category: "Medical Health Conditions", fieldCaption: "Type", status: "Active" },
  { id: 2, title: "Arthritis", category: "Medical Health Conditions", fieldCaption: "", status: "Active" },
  { id: 3, title: "Heart Condition", category: "Medical Health Conditions", fieldCaption: "Type", status: "Active" },
  { id: 4, title: "Diabetes", category: "Medical Health Conditions", fieldCaption: "Type", status: "Active" },
  { id: 5, title: "Chronic Pain", category: "Medical Health Conditions", fieldCaption: "Type", status: "Active" },
  { id: 6, title: "Chronic Respiratory", category: "Medical Health Conditions", fieldCaption: "Type", status: "Active" },
  { id: 7, title: "Addiction", category: "Medical Health Conditions", fieldCaption: "Type", status: "Active" },
  { id: 8, title: "Other Medical Conditions", category: "Medical Health Conditions", fieldCaption: "Type", status: "Active" },
  { id: 9, title: "Blood Pressure", category: "Medical Health Conditions", fieldCaption: "", status: "Active" },
  { id: 10, title: "Thyroid", category: "Medical Health Conditions", fieldCaption: "", status: "Active" },
  { id: 11, title: "Multiple Sclerosis", category: "Medical Health Conditions", fieldCaption: "", status: "Active" },
  { id: 12, title: "Parkinson's", category: "Medical Health Conditions", fieldCaption: "Parkinson's", status: "Active" },
  { id: 13, title: "Dementia", category: "Mental Health Conditions", fieldCaption: "", status: "Active" },
  { id: 14, title: "Insomnia", category: "Mental Health Conditions", fieldCaption: "", status: "Active" },
  { id: 15, title: "Anxiety", category: "Mental Health Conditions", fieldCaption: "", status: "Active" },
];

// Mock data for categories
const categoriesData = [
  { id: 1, name: "Medical Health Conditions", status: "Active" },
  { id: 2, name: "Mental Health Conditions", status: "Active" },
];

const MedicalMental = () => {
  const [activeTab, setActiveTab] = useState("conditions");
  const [filteredConditions, setFilteredConditions] = useState(conditionsData);
  const [filteredCategories, setFilteredCategories] = useState(categoriesData);
  const [showConditionDialog, setShowConditionDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  
  const conditionsColumns = [
    {
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[25%]",
    },
    {
      header: "Category",
      accessorKey: "category",
      enableSorting: true,
      className: "text-gray-700 w-[35%]",
    },
    {
      header: "Field Caption",
      accessorKey: "fieldCaption",
      enableSorting: true,
      className: "text-gray-700 w-[25%]",
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
  
  const categoryColumns = [
    {
      header: "Category Name",
      accessorKey: "name",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[85%]",
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
  
  const handleConditionsSearch = (query: string) => {
    if (!query) {
      setFilteredConditions(conditionsData);
    } else {
      const filtered = conditionsData.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredConditions(filtered);
    }
  };
  
  const handleCategoriesSearch = (query: string) => {
    if (!query) {
      setFilteredCategories(categoriesData);
    } else {
      const filtered = categoriesData.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  };

  const handleAddCondition = (condition: any) => {
    setFilteredConditions([...filteredConditions, { ...condition, id: filteredConditions.length + 1 }]);
  };

  const handleAddCategory = (category: any) => {
    setFilteredCategories([...filteredCategories, { ...category, id: filteredCategories.length + 1 }]);
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
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Stethoscope className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Medical & Mental</h1>
                <p className="text-gray-500 text-sm md:text-base">Manage health parameters</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <CustomButton 
                variant="pill" 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                onClick={() => activeTab === "conditions" ? setShowConditionDialog(true) : setShowCategoryDialog(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" /> New {activeTab === "conditions" ? "Condition" : "Category"}
              </CustomButton>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden mb-8">
          <Tabs defaultValue="conditions" onValueChange={setActiveTab}>
            <div className="border-b border-gray-100">
              <TabsList className="bg-gray-50/80 w-full justify-start pl-4 h-14 space-x-2">
                <TabsTrigger 
                  value="conditions" 
                  className={`rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700`}
                >
                  Conditions
                </TabsTrigger>
                <TabsTrigger 
                  value="category" 
                  className={`rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700`}
                >
                  Category
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="conditions" className="mt-0 p-0">
              <ParameterTable 
                title=""
                icon={<></>}
                columns={conditionsColumns}
                data={filteredConditions}
                onSearch={handleConditionsSearch}
                searchPlaceholder="Search conditions..."
              />
            </TabsContent>
            
            <TabsContent value="category" className="mt-0 p-0">
              <ParameterTable 
                title=""
                icon={<></>}
                columns={categoryColumns}
                data={filteredCategories}
                onSearch={handleCategoriesSearch}
                searchPlaceholder="Search categories..."
              />
            </TabsContent>
          </Tabs>
        </div>

        <AddMedicalConditionDialog 
          isOpen={showConditionDialog} 
          onClose={() => setShowConditionDialog(false)}
          onAdd={handleAddCondition}
          categories={categoriesData}
          isCategory={false}
        />

        <AddMedicalConditionDialog 
          isOpen={showCategoryDialog} 
          onClose={() => setShowCategoryDialog(false)}
          onAdd={handleAddCategory}
          categories={[]}
          isCategory={true}
        />
      </motion.main>
    </div>
  );
};

export default MedicalMental;
