import React from "react";
import { Activity } from "lucide-react";
import { ClientNews2Dashboard } from "@/components/client/ClientNews2Dashboard";

interface ClientNews2TabProps {
  clientId: string;
}

export const ClientNews2Tab: React.FC<ClientNews2TabProps> = ({ clientId }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">NEWS2 Health Monitoring</h2>
      </div>
      <div className="rounded-lg bg-card border">
        <ClientNews2Dashboard isAdminView={true} clientId={clientId} />
      </div>
    </div>
  );
};