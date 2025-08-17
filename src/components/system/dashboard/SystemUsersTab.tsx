import React from "react";
import { SystemUsersStats } from "@/components/system/SystemUsersStats";

export const SystemUsersTab: React.FC = () => {
  return (
    <section>
      <SystemUsersStats stats={undefined} isLoading={false} />

      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">System Users</h3>
        <p className="text-muted-foreground">
          Manage organization super admins and their roles. A detailed users list will appear here.
        </p>
      </div>
    </section>
  );
};
