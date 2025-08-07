import React from "react";
import { Shield, Server, Activity, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="bg-card rounded-lg shadow-sm border border-border p-4 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold">System Portal</h1>
            <Badge variant={systemInfo.status === "Operational" ? "default" : "destructive"} className="text-xs">
              {systemInfo.status}
            </Badge>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Server className="h-3.5 w-3.5 text-muted-foreground" />
              <span>v{systemInfo.version}</span>
            </div>
            <div className="hidden md:flex items-center text-muted-foreground">|</div>
            <div className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Uptime: {systemInfo.uptime}</span>
            </div>
            <div className="hidden md:flex items-center text-muted-foreground">|</div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Last Updated: {systemInfo.lastUpdate}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-start md:justify-end">
          <Button 
            onClick={onQuickAction} 
            variant="default"
            className="h-9 bg-primary hover:bg-primary/90 rounded-full px-4 shadow-sm"
          >
            <Shield className="h-4 w-4 mr-2" />
            <span>System Health</span>
          </Button>
        </div>
      </div>
    </div>
  );
};