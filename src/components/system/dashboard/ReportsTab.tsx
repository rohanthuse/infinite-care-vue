import React from "react";
import { SystemReports } from "@/components/system/dashboard/SystemReports";

export const ReportsTab: React.FC = () => {
  return (
    <section>
      <div className="bg-card border border-border rounded-lg p-4">
        <SystemReports />
      </div>
    </section>
  );
};
