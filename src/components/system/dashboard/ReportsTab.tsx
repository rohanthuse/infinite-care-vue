import React from "react";
import { ReportsContent } from "@/components/reports/ReportsContent";

export const ReportsTab: React.FC = () => {
  return (
    <section>
      <div className="bg-card border border-border rounded-lg p-4">
        <ReportsContent branchId="system" branchName="System" />
      </div>
    </section>
  );
};
