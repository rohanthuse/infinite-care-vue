
import React from "react";
import { Card } from "@/components/ui/card";

interface CarePlansTabProps {
  clientId: string;
}

export const CarePlansTab: React.FC<CarePlansTabProps> = ({ clientId }) => {
  return (
    <div className="space-y-6">
      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Client Care Plans</h3>
        <p className="text-gray-500">No care plans have been created yet for client {clientId}.</p>
      </Card>
    </div>
  );
};
