
import React from "react";
import { Button } from "@/components/ui/button";

export interface CommunicationsTabProps {
  branchId?: string;
  branchName?: string;
}

export const CommunicationsTab: React.FC<CommunicationsTabProps> = ({ branchId, branchName }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Communications</h2>
      <p className="text-gray-500 mb-6">Manage internal and external communications.</p>
      
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Communications module is coming soon</p>
          <Button>Request Early Access</Button>
        </div>
      </div>
    </div>
  );
};
