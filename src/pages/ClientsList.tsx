
import React, { useState } from "react";
import { TabNavigation } from "@/components/TabNavigation";
import { useParams } from "react-router-dom";

interface ClientsListProps {
  branchId?: string;
  branchName?: string;
}

const ClientsList: React.FC<ClientsListProps> = () => {
  const { id, branchName } = useParams();
  const [activeTab, setActiveTab] = useState("clients");

  return (
    <div className="container py-6 space-y-8">
      <TabNavigation 
        activeTab={activeTab} 
        onChange={setActiveTab} 
        hideQuickAdd={true}
      />
      
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-gray-700 text-2xl font-semibold mb-4">Client information</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-800 mb-6">Clients Page</h1>
            <p className="text-lg text-gray-600">This page is under development. Check back soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsList;
