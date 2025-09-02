import React, { useState, useEffect } from "react";
import { LibraryResourcesList } from "@/components/library/LibraryResourcesList";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";
import { AgreementShortcutCard } from "@/components/agreements/AgreementShortcutCard";

const ClientLibrary = () => {
  const { data: authData } = useSimpleClientAuth();
  const [branchId, setBranchId] = useState<string>("");

  // Set page title
  useEffect(() => {
    document.title = "Library Resources | Client Dashboard";
  }, []);

  useEffect(() => {
    if (authData?.client?.branch_id) {
      setBranchId(authData.client.branch_id);
    }
  }, [authData]);

  if (!branchId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Access Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AgreementShortcutCard />
      </div>

      {/* Main Library Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold">Library Resources</h2>
          <p className="text-gray-500 mt-1">Browse and access educational and reference materials</p>
        </div>
        
        <div className="p-4 md:p-6 max-w-full">
          <LibraryResourcesList branchId={branchId} canDelete={false} showEngagementMetrics={false} />
        </div>
      </div>
    </div>
  );
};

export default ClientLibrary;