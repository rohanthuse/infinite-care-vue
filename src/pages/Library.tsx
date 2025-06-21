
import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TabNavigation } from "@/components/TabNavigation";
import { LibraryResourcesList } from "@/components/library/LibraryResourcesList";
import { LibraryResourceForm } from "@/components/library/LibraryResourceForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Library = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [activeNavTab, setActiveNavTab] = useState("library");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  useEffect(() => {
    document.title = `Library | ${decodedBranchName}`;
  }, [decodedBranchName]);
  
  const handleNavTabChange = (value: string) => {
    setActiveNavTab(value);
    
    if (value !== "library") {
      if (id && branchName) {
        navigate(`/admin/branch-dashboard/${id}/${encodeURIComponent(decodedBranchName)}/${value}`);
      } else {
        navigate(`/admin/${value}`);
      }
    }
  };
  
  const handleNewBooking = () => {
    toast.info("New booking functionality will be implemented soon");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-8 md:py-6 w-full max-w-[1600px] mx-auto">
        <BranchInfoHeader 
          branchName={decodedBranchName} 
          branchId={id || ""}
          onNewBooking={handleNewBooking}
        />
        
        <div className="mt-6">
          <TabNavigation 
            activeTab={activeNavTab} 
            onChange={handleNavTabChange} 
            hideActionsOnMobile={true}
          />
        </div>
        
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Resource Library</h2>
              <p className="text-gray-500 mt-1">Manage training materials, guides, and resources</p>
            </div>
            <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Resource
            </Button>
          </div>
          
          <div className="p-6">
            {showCreateForm ? (
              <LibraryResourceForm 
                branchId={id || ""} 
                onSuccess={() => setShowCreateForm(false)}
                onCancel={() => setShowCreateForm(false)}
              />
            ) : (
              <LibraryResourcesList branchId={id || ""} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Library;
