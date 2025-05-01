
import React from "react";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ClientHeader: React.FC<{ title: string }> = ({ title }) => {
  const clientName = localStorage.getItem("clientName") || "Client";
  const notificationCount = 2; // For demonstration
  
  return (
    <header className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        
        {/* Search and Actions */}
        <div className="flex items-center gap-6">
          {/* Search */}
          <div className="relative hidden md:block w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
          
          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </div>
          
          {/* Profile */}
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-800">
                {clientName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{clientName}</p>
              <p className="text-xs text-gray-500">Client</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ClientHeader;
