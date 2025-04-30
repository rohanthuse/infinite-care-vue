
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClientTabBarProps {
  activeTab: string;
  onChange: (value: string) => void;
}

export const ClientTabBar: React.FC<ClientTabBarProps> = ({ activeTab, onChange }) => {
  return (
    <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full mb-4">
      <TabsTrigger 
        value="personal" 
        onClick={() => onChange("personal")}
        className={activeTab === "personal" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}
      >
        Personal Info
      </TabsTrigger>
      <TabsTrigger 
        value="notes" 
        onClick={() => onChange("notes")}
        className={activeTab === "notes" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}
      >
        Notes
      </TabsTrigger>
      <TabsTrigger 
        value="documents" 
        onClick={() => onChange("documents")}
        className={activeTab === "documents" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}
      >
        Documents
      </TabsTrigger>
      <TabsTrigger 
        value="appointments" 
        onClick={() => onChange("appointments")}
        className={activeTab === "appointments" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}
      >
        Appointments
      </TabsTrigger>
      <TabsTrigger 
        value="billing" 
        onClick={() => onChange("billing")}
        className={activeTab === "billing" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}
      >
        Billing
      </TabsTrigger>
      <TabsTrigger 
        value="careplans" 
        onClick={() => onChange("careplans")}
        className={activeTab === "careplans" ? "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700" : ""}
      >
        Care Plans
      </TabsTrigger>
    </TabsList>
  );
};
