import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

// Shared system-level tabs shown across System Dashboard, Tenants, Users, Tenant Agreements, Subscription Plans, and Reports
// This component only renders the TabsList + Triggers. Parent should wrap with <Tabs value=...>
// Navigation is handled here to keep behavior consistent.
// Note: "notifications" is a hidden tab accessible only via URL parameter and menu
export type SystemTabValue = "dashboard" | "tenants" | "users" | "tenant-agreements" | "subscription-plans" | "reports" | "notifications";

interface SystemSectionTabsProps {
  value: SystemTabValue;
}

export const SystemSectionTabs: React.FC<SystemSectionTabsProps> = ({ value }) => {
  const navigate = useNavigate();

  return (
    <TabsList className="w-full grid grid-cols-2 md:grid-cols-6 mb-6 bg-gradient-to-r from-muted/80 via-muted to-blue-50/50 dark:to-blue-950/30 p-1.5 rounded-xl shadow-sm">
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
        Tenant Users
      </TabsTrigger>
      <TabsTrigger
        value="tenant-agreements"
        data-active={value === "tenant-agreements"}
        onClick={() => navigate("/system-dashboard/tenant-agreements")}
      >
        Tenant Agreements
      </TabsTrigger>
      <TabsTrigger
        value="subscription-plans"
        data-active={value === "subscription-plans"}
        onClick={() => navigate("/system-dashboard/subscription-plans")}
      >
        Subscription Plans
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

