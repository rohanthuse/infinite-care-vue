import React from "react";
import { Shield, Server, Activity, Clock, MoreVertical, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  return <div className="bg-card rounded-lg shadow-sm border border-border p-4 md:p-6 mb-6">
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
        </div>
        
        <div className="flex justify-start md:justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/system-dashboard?tab=notifications')}>
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>;
};