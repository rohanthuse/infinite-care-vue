
import React from "react";
import { Card } from "@/components/ui/card";

interface BillingTabProps {
  clientId: string;
}

export const BillingTab: React.FC<BillingTabProps> = ({ clientId }) => {
  return (
    <div className="space-y-6">
      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Billing Information</h3>
        <p className="text-gray-500">No billing information has been added yet for client {clientId}.</p>
      </Card>
    </div>
  );
};
