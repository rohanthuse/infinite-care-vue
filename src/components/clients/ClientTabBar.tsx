
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MessageCircle, FileText, Calendar, CreditCard, ClipboardList, FileBarChart2 } from "lucide-react";

interface ClientTabBarProps {
  activeTab: string;
  onChange: (value: string) => void;
}

export const ClientTabBar: React.FC<ClientTabBarProps> = ({ activeTab, onChange }) => {
  return (
    <TabsList className="grid grid-cols-2 md:grid-cols-7 w-full mb-4 overflow-x-auto">
      <TabsTrigger 
        value="personal"
        onClick={() => onChange("personal")}
        className={`flex items-center gap-1 ${activeTab === "personal" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <User className="h-4 w-4" />
        <span>Personal Info</span>
      </TabsTrigger>
      <TabsTrigger 
        value="notes" 
        onClick={() => onChange("notes")}
        className={`flex items-center gap-1 ${activeTab === "notes" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <MessageCircle className="h-4 w-4" />
        <span>Notes</span>
      </TabsTrigger>
      <TabsTrigger 
        value="documents" 
        onClick={() => onChange("documents")}
        className={`flex items-center gap-1 ${activeTab === "documents" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <FileText className="h-4 w-4" />
        <span>Documents</span>
      </TabsTrigger>
      <TabsTrigger 
        value="appointments" 
        onClick={() => onChange("appointments")}
        className={`flex items-center gap-1 ${activeTab === "appointments" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <Calendar className="h-4 w-4" />
        <span>Appointments</span>
      </TabsTrigger>
      <TabsTrigger 
        value="billing" 
        onClick={() => onChange("billing")}
        className={`flex items-center gap-1 ${activeTab === "billing" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <CreditCard className="h-4 w-4" />
        <span>Billing</span>
      </TabsTrigger>
      <TabsTrigger 
        value="careplans" 
        onClick={() => onChange("careplans")}
        className={`flex items-center gap-1 ${activeTab === "careplans" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <ClipboardList className="h-4 w-4" />
        <span>Care Plans</span>
      </TabsTrigger>
      <TabsTrigger 
        value="eventslogs" 
        onClick={() => onChange("eventslogs")}
        className={`flex items-center gap-1 ${activeTab === "eventslogs" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}`}
      >
        <FileBarChart2 className="h-4 w-4" />
        <span>Events & Logs</span>
      </TabsTrigger>
    </TabsList>
  );
};
