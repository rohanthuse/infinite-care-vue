
import React from "react";
import { EnhancedBillingTab } from "./EnhancedBillingTab";

interface BillingTabProps {
  clientId: string;
  billingItems?: any[];
}

export const BillingTab: React.FC<BillingTabProps> = ({ clientId }) => {
  // For now, we'll use a placeholder branch ID. In a real implementation,
  // this would come from the client's associated branch or current user context
  const branchId = "placeholder-branch-id";

  return <EnhancedBillingTab clientId={clientId} branchId={branchId} />;
};
