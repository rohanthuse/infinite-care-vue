import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { BranchHeader } from "@/components/BranchHeader";

const Medication = () => {
  const location = useLocation();
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Set the activeTab correctly for navigation
  const activeTab = "medication";

  // Update handleChangeTab to properly navigate to workflow paths
  const handleChangeTab = (value: string) => {
    if (id && branchName) {
      if (value === "dashboard") {
        navigate(`/branch-dashboard/${id}/${branchName}`);
      } else if (value === "workflow") {
        navigate(`/branch-dashboard/${id}/${branchName}/task-matrix`);
      } else {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      }
    } else {
      if (value === "workflow") {
        navigate(`/workflow/task-matrix`);
      } else if (value.includes("matrix") || value === "medication") {
        navigate(`/workflow/${value}`);
      } else {
        navigate(`/${value}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <DashboardHeader />

      <main className="flex-1 container mx-auto px-4 py-6">
        {id && branchName && (
          <BranchHeader
            id={id}
            branchName={branchName}
            onNewBooking={() => { }}
          />
        )}

        <TabNavigation
          activeTab={activeTab}
          onChange={handleChangeTab}
          hideQuickAdd={true}
        />

        <div className="mt-6 space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Medication</h1>
          <p className="text-gray-500 mt-1">Manage and track medications.</p>
        </div>
      </main>
    </div>
  );
};

export default Medication;
