import React from "react";
import { ClientNews2Dashboard } from "@/components/client/ClientNews2Dashboard";

const ClientHealthMonitoring = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">Health Monitoring</h1>
        <p className="text-gray-600 dark:text-muted-foreground">
          Track your vital signs and health indicators with NEWS2 monitoring
        </p>
      </div>
      
      <ClientNews2Dashboard />
    </div>
  );
};

export default ClientHealthMonitoring;
