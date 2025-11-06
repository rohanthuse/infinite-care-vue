import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

// Shared system-level tabs shown across System Dashboard, Tenants, Users, and Reports
// This component only renders the TabsList + Triggers. Parent should wrap with <Tabs value=...>
// Navigation is handled here to keep behavior consistent.
export type SystemTabValue = "dashboard" | "tenants" | "users" | "reports";

interface SystemSectionTabsProps {
  value: SystemTabValue;
}

export const SystemSectionTabs: React.FC<SystemSectionTabsProps> = ({ value }) => {
  const navigate = useNavigate();

  return (
    <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 mb-6">
      <TabsTrigger
        value="dashboard"
        data-active={value === "dashboard"}
        onClick={() => navigate("/system-dashboard?tab=dashboard")}
      >
        Dashboard
      </TabsTrigger>
      <TabsTrigger
        value="tenants"
        data-active={value === "tenants"}
        onClick={() => navigate("/system-dashboard/tenants")}
      >
        Tenant Organisations
      </TabsTrigger>
      <TabsTrigger
        value="users"
        data-active={value === "users"}
        onClick={() => navigate("/system-dashboard/users")}
      >
        System Users
      </TabsTrigger>
      <TabsTrigger
        value="reports"
        data-active={value === "reports"}
        onClick={() => navigate("/system-dashboard?tab=reports")}
      >
        Reports
      </TabsTrigger>
    </TabsList>
  );
};

