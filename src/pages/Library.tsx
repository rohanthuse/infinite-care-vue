
import React, { useState, useEffect } from "react";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { LibraryResourcesList } from "@/components/library/LibraryResourcesList";
import { LibraryResourceForm } from "@/components/library/LibraryResourceForm";

const Library = () => {
  const { id, branchName } = useParams();
  const [activeTab, setActiveTab] = useState("view");
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  // Set page title
  useEffect(() => {
    document.title = `Library | ${decodedBranchName}`;
  }, [decodedBranchName]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleResourceAdded = () => {
    // Switch to the view tab after a resource is added successfully
    setActiveTab("view");
    toast.success("Resource added successfully to the library");
  };

  return (
    <BranchLayout>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold">Library Resources</h2>
          <p className="text-gray-500 mt-1">Add, manage and share educational and reference materials</p>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange} 
          className="w-full flex flex-col flex-1"
        >
          <div className="bg-gray-50 border-b border-gray-100 p-1.5 sm:p-2.5 sticky top-0 z-20">
            <TabsList className="w-full grid grid-cols-2 rounded-md overflow-hidden bg-gray-100/80 p-0.5 sm:p-1">
              <TabsTrigger 
                value="add" 
                className="text-base font-medium py-2.5 rounded-md transition-all duration-200 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:bg-green-500"
              >
                Add Resource
              </TabsTrigger>
              <TabsTrigger 
                value="view" 
                className="text-base font-medium py-2.5 rounded-md transition-all duration-200 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:bg-green-500"
              >
                Browse Resources
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent 
              value="add" 
              className="p-0 focus:outline-none m-0 h-full overflow-y-auto"
            >
              <div className="p-4 md:p-6 max-w-full">
                <LibraryResourceForm 
                  branchId={id || ""} 
                  onResourceAdded={handleResourceAdded}
                />
              </div>
            </TabsContent>
            <TabsContent 
              value="view" 
              className="p-0 focus:outline-none m-0 h-full overflow-y-auto"
            >
              <div className="p-4 md:p-6 max-w-full">
                <LibraryResourcesList 
                  branchId={id || ""} 
                  onAddNew={() => handleTabChange("add")}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </BranchLayout>
  );
};

export default Library;
