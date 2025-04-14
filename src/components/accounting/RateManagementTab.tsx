
import React from "react";
import { Button } from "@/components/ui/button";
import { Percent, Settings } from "lucide-react";

interface RateManagementTabProps {
  branchId?: string;
  branchName?: string;
}

const RateManagementTab: React.FC<RateManagementTabProps> = ({ branchId, branchName }) => {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Rate Management</h2>
          <p className="text-gray-500 mt-1">Configure and manage service rates</p>
        </div>
      </div>
      
      {/* Placeholder for rate management content */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Percent className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Rate Configuration</h3>
        <p className="text-gray-500">This module will allow configuring service rates for {branchName}.</p>
        <Button 
          variant="default" 
          className="mt-4 bg-blue-600 hover:bg-blue-700"
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Rates
        </Button>
      </div>
    </div>
  );
};

export default RateManagementTab;
