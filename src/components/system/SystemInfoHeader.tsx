import React from "react";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SystemInfoHeaderProps {
  systemInfo: {
    status: string;
    version: string;
    uptime: string;
    serverLocation: string;
    lastUpdate: string;
  };
  onQuickAction: () => void;
}

export const SystemInfoHeader = ({
  systemInfo,
  onQuickAction
}: SystemInfoHeaderProps) => {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4 md:p-6 mb-6 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-blue-500 before:via-cyan-500 before:to-emerald-500">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold">System Portal</h1>
        <Badge variant={systemInfo.status === "Operational" ? "default" : "destructive"} className="text-xs">
          {systemInfo.status}
        </Badge>
      </div>
    </div>
  );
};