
import React from "react";
import { Card } from "@/components/ui/card";

interface AppointmentsTabProps {
  clientId: string;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ clientId }) => {
  return (
    <div className="space-y-6">
      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Client Appointments</h3>
        <p className="text-gray-500">No appointments have been scheduled yet for client {clientId}.</p>
      </Card>
    </div>
  );
};
