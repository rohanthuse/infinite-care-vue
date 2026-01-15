import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  CalendarDays,
  ClipboardList,
  Clock,
  FileText,
  ScrollText,
  FileBarChart,
  Home,
  Users,
  User,
  Book,
  MessageSquare,
  Wallet,
  GraduationCap,
  AlertTriangle,
  Files,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

export const CarerSidebar: React.FC = () => {
  const location = useLocation();
  const { getCarerMenuItems, tenantSlug } = useCarerNavigation();
  const { open } = useSidebar();

  // Debug logging for development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[CarerSidebar] Navigation state:', {
        tenantSlug,
        currentPath: location.pathname,
        devTenant: localStorage.getItem('dev-tenant'),
        menuItemPaths: getCarerMenuItems().map(item => ({ name: item.name, path: item.path }))
      });
    }
  }, [tenantSlug, location.pathname, getCarerMenuItems]);

  const carerName = localStorage.getItem("carerName") || "Carer";
  
  const menuSections = [
    {
      label: "Main",
      items: [
        { 
          name: "Dashboard", 
          path: getCarerMenuItems().find(item => item.name === "Dashboard")?.path || "/carer-dashboard", 
          icon: Home 
        },
        { 
          name: "Profile", 
          path: getCarerMenuItems().find(item => item.name === "Profile")?.path || "/carer-dashboard/profile", 
          icon: User 
        },
      ]
    },
    {
      label: "Schedule",
      items: [
        { 
          name: "My Schedule", 
          path: getCarerMenuItems().find(item => item.name === "Booking Calendar")?.path || "/carer-dashboard/schedule", 
          icon: Calendar 
        },
        { 
          name: "Appointments", 
          path: getCarerMenuItems().find(item => item.name === "Appointments")?.path || "/carer-dashboard/appointments", 
          icon: CalendarDays 
        },
        { 
          name: "Leave", 
          path: getCarerMenuItems().find(item => item.name === "Leave")?.path || "/carer-dashboard/leave", 
          icon: Calendar 
        },
      ]
    },
    {
      label: "Clients",
      items: [
        { 
          name: "My Clients", 
          path: getCarerMenuItems().find(item => item.name === "My Clients")?.path || "/carer-dashboard/clients", 
          icon: Users 
        },
        { 
          name: "Care Plans", 
          path: getCarerMenuItems().find(item => item.name === "Care Plans")?.path || "/carer-dashboard/careplans", 
          icon: FileText 
        },
      ]
    },
    {
      label: "Tasks & Assignments",
      items: [
        { 
          name: "My Tasks", 
          path: getCarerMenuItems().find(item => item.name === "Tasks")?.path || "/carer-dashboard/tasks", 
          icon: ClipboardList 
        },
        { 
          name: "My Assignments", 
          path: getCarerMenuItems().find(item => item.name === "My Assignments")?.path || "/carer-dashboard/my-tasks", 
          icon: AlertTriangle 
        },
        { 
          name: "Events & Logs", 
          path: getCarerMenuItems().find(item => item.name === "Events & Logs")?.path || "/carer-dashboard/events-logs", 
          icon: Files 
        },
      ]
    },
    {
      label: "Documents",
      items: [
        { 
          name: "My Agreements", 
          path: getCarerMenuItems().find(item => item.name === "My Agreements")?.path || "/carer-dashboard/agreements", 
          icon: ScrollText 
        },
        { 
          name: "Documents", 
          path: getCarerMenuItems().find(item => item.name === "My Forms")?.path || "/carer-dashboard/documents", 
          icon: FileText 
        },
        { 
          name: "Library", 
          path: getCarerMenuItems().find(item => item.name === "Library")?.path || "/carer-dashboard/library", 
          icon: Book 
        },
      ]
    },
    {
      label: "Reports",
      items: [
        { 
          name: "Attendance", 
          path: getCarerMenuItems().find(item => item.name === "Reports")?.path || "/carer-dashboard/attendance", 
          icon: Clock 
        },
        { 
          name: "Service Reports", 
          path: getCarerMenuItems().find(item => item.name === "Service Reports")?.path || "/carer-dashboard/service-reports", 
          icon: FileBarChart 
        },
      ]
    },
    {
      label: "Other",
      items: [
        { 
          name: "Messages", 
          path: getCarerMenuItems().find(item => item.name === "Messages")?.path || "/carer-dashboard/messages", 
          icon: MessageSquare 
        },
        { 
          name: "Payments", 
          path: getCarerMenuItems().find(item => item.name === "Payments")?.path || "/carer-dashboard/payments", 
          icon: Wallet 
        },
        { 
          name: "Training", 
          path: getCarerMenuItems().find(item => item.name === "Training")?.path || "/carer-dashboard/training", 
          icon: GraduationCap 
        },
      ]
    }
  ];

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r shrink-0"
    >
      <SidebarContent className="overflow-y-auto">
        {/* User Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
              {carerName.charAt(0).toUpperCase()}
            </div>
            {open && <span className="font-semibold text-foreground">{carerName}</span>}
          </div>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <SidebarGroup key={section.label}>
            {open && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.path} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Footer */}
        {open && (
          <div className="mt-auto p-4 border-t">
            <div className="text-xs text-muted-foreground mb-1">Med-Infinite</div>
            <div className="text-xs text-muted-foreground">Version 1.0.0</div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};
