
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { BranchHeader } from "@/components/BranchHeader";

const Clients = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const activeTab = "clients";

  const handleChangeTab = (value: string) => {
    if (id && branchName) {
      if (value === "dashboard") {
        navigate(`/branch-dashboard/${id}/${branchName}`);
      } else if (value === "workflow" || ["task-matrix", "training-matrix", "form-matrix", "medication"].includes(value)) {
        const path = value === "workflow" ? "task-matrix" : value;
        navigate(`/branch-dashboard/${id}/${branchName}/${path}`);
      } else {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      }
    } else {
      if (value === "dashboard") {
        navigate("/dashboard");
      } else if (value === "workflow" || ["task-matrix", "training-matrix", "form-matrix", "medication"].includes(value)) {
        const path = value === "workflow" ? "task-matrix" : value;
        navigate(`/workflow/${path}`);
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
            onNewBooking={() => {}}
          />
        )}

        <TabNavigation
          activeTab={activeTab}
          onChange={handleChangeTab}
          hideQuickAdd={false}
        />

        <div className="mt-6 space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
          <p className="text-gray-500 mt-1">Manage and view client information.</p>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <p className="text-gray-600 text-center py-8">Client management features coming soon.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Clients;
