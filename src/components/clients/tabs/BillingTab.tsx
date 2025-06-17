
import React from "react";
import { useParams } from "react-router-dom";
import { EnhancedBillingTab } from "./EnhancedBillingTab";

interface BillingTabProps {
  clientId: string;
  billingItems?: any[];
}

export const BillingTab: React.FC<BillingTabProps> = ({ clientId }) => {
  const { branchId } = useParams();
  
  if (!branchId) {
    console.error('Branch ID not found in route parameters');
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-red-600">Error: Branch information not available</p>
      </div>
    );
  }

  return <EnhancedBillingTab clientId={clientId} branchId={branchId} />;
};
