
import React from "react";
import { EnhancedBillingTab } from "./EnhancedBillingTab";

interface BillingTabProps {
  clientId: string;
  branchId: string;
  billingItems?: any[];
}

export const BillingTab: React.FC<BillingTabProps> = ({ clientId, branchId }) => {
  if (!branchId) {
    console.error('Branch ID not provided as prop');
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-red-600">Error: Branch information not available</p>
      </div>
    );
  }

  return <EnhancedBillingTab clientId={clientId} branchId={branchId} />;
};
