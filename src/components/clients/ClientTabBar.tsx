
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, User, MessageCircle, FileText, Calendar, CreditCard, ClipboardList, FileBarChart2, Heart, Activity, Settings, ArrowRightLeft } from "lucide-react";

interface ClientTabBarProps {
  activeTab: string;
  onChange: (value: string) => void;
}

export const ClientTabBar: React.FC<ClientTabBarProps> = ({ activeTab, onChange }) => {
  return (
    <div className="w-full">
      <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
        <TabsTrigger 
          value="overview"
          onClick={() => onChange("overview")}
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <BarChart3 className="h-4 w-4" />
          <span>Overview</span>
        </TabsTrigger>
        <TabsTrigger 
          value="personal"
          onClick={() => onChange("personal")}
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <User className="h-4 w-4" />
          <span>Personal Info</span>
        </TabsTrigger>
        <TabsTrigger 
          value="general"
          onClick={() => onChange("general")}
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <Settings className="h-4 w-4" />
          <span>General</span>
        </TabsTrigger>
        <TabsTrigger 
          value="news2"
          onClick={() => onChange("news2")}
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <Activity className="h-4 w-4" />
          <span>NEWS2</span>
        </TabsTrigger>
        <TabsTrigger 
          value="careplans" 
          onClick={() => onChange("careplans")}
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <ClipboardList className="h-4 w-4" />
          <span>Care Plans</span>
        </TabsTrigger>
        <TabsTrigger 
          value="handover"
          onClick={() => onChange("handover")}
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Handover</span>
        </TabsTrigger>
        <TabsTrigger 
          value="notes" 
          onClick={() => onChange("notes")}
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Notes</span>
        </TabsTrigger>
        <TabsTrigger
          value="documents" 
          onClick={() => onChange("documents")}
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <FileText className="h-4 w-4" />
          <span>Documents</span>
        </TabsTrigger>
        <TabsTrigger 
          value="appointments" 
          onClick={() => onChange("appointments")}
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <Calendar className="h-4 w-4" />
          <span>Appointments</span>
        </TabsTrigger>
        <TabsTrigger 
          value="billing" 
          onClick={() => onChange("billing")}
          className="flex items-center gap-1 whitespace-nowrap"
        >
          <CreditCard className="h-4 w-4" />
          <span>Billing</span>
        </TabsTrigger>
      </TabsList>
    </div>
  );
};
