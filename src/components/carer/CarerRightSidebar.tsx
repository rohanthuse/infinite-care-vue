import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, User, Calendar, CalendarDays, FileText, 
  ClipboardList, Clock, FileBarChart, Wallet, 
  GraduationCap, Users, AlertTriangle, MessageSquare,
  Bell, Search, ScrollText, Book
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

  const primaryItems = [
    { icon: Home, label: "Dashboard", value: "", description: "Home overview" },
    { icon: Calendar, label: "My Schedule", value: "schedule", description: "Booking calendar" },
    { icon: CalendarDays, label: "Appointments", value: "appointments", description: "View all appointments" },
    { icon: Users, label: "My Clients", value: "clients", description: "Client list" },
    { icon: ClipboardList, label: "My Tasks", value: "tasks", description: "Task management" },
    { icon: AlertTriangle, label: "My Assignments", value: "my-tasks", description: "Assigned tasks" },
    { icon: FileText, label: "Events & Logs", value: "events-logs", description: "Assigned events and logs" },
  ];

  const secondaryGroups = [
    {
      label: "Care & Planning",
      items: [
        { icon: FileText, label: "Care Plans", value: "careplans" },
        { icon: ScrollText, label: "My Agreements", value: "agreements" },
        { icon: Book, label: "Library", value: "library" },
      ]
    },
    {
      label: "Reports & Documents",
      items: [
        { icon: Clock, label: "Attendance", value: "attendance" },
        { icon: FileBarChart, label: "Service Reports", value: "service-reports" },
        { icon: FileText, label: "Documents", value: "documents" },
        { icon: FileText, label: "My Forms", value: "forms" },
      ]
    },
    {
      label: "Personal",
      items: [
        { icon: User, label: "Profile", value: "profile" },
        { icon: Wallet, label: "Payments", value: "payments" },
        { icon: GraduationCap, label: "Training", value: "training" },
        { icon: Calendar, label: "Leave", value: "leave" },
        { icon: MessageSquare, label: "Messages", value: "messages" },
        { icon: Bell, label: "Notifications", value: "notifications" },
      ]
    }
  ];

export const CarerRightSidebar: React.FC = () => {
  const { open: sidebarOpen, isMobile } = useSidebar();
  const { createCarerPath } = useCarerNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Care & Planning": true,
    "Reports & Documents": true,
    "Personal": true
  });

  // On mobile (inside Sheet), always show full content; on desktop, respect sidebarOpen
  const showContent = isMobile || sidebarOpen;

  const handleNavClick = (value: string) => {
    const path = createCarerPath(value ? `/${value}` : '');
    navigate(path);
  };

  const isActive = (value: string) => {
    const expectedPath = createCarerPath(value ? `/${value}` : '');
    return location.pathname === expectedPath;
  };

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Filter items based on search
  const filteredPrimaryItems = primaryItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSecondaryGroups = secondaryGroups.map(group => ({
    ...group,
    items: group.items.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  return (
    <Sidebar 
      side="right" 
      collapsible="icon"
      className={cn(
        "border-l bg-sidebar z-30",
        // On desktop show inline, on mobile the Sidebar component handles Sheet automatically
        "max-lg:!w-0 max-lg:!min-w-0 max-lg:border-0",
        sidebarOpen ? "lg:w-64" : "lg:w-14"
      )}
      style={{
        '--sidebar-width': '16rem',
        '--sidebar-width-icon': '3.5rem',
      } as React.CSSProperties}
    >
      <SidebarHeader className="border-b p-3 lg:p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          {showContent && <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100">Navigation</h2>}
          <SidebarTrigger className={cn(!showContent && "mx-auto", "text-gray-700 dark:text-gray-300")} />
        </div>
        
        {showContent && (
          <div className="mt-3 lg:mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 border-gray-200 dark:border-gray-700"
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-white dark:bg-gray-900">
        {/* Primary Items */}
        <SidebarGroup>
          {showContent && <SidebarGroupLabel className="text-gray-600 dark:text-gray-400">Main</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredPrimaryItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => handleNavClick(item.value)}
                    isActive={isActive(item.value)}
                    tooltip={!showContent ? item.label : undefined}
                    className={cn(
                      "w-full justify-start text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                      isActive(item.value) && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <item.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    {showContent && <span className="ml-2 text-gray-800 dark:text-gray-100">{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Groups */}
        {filteredSecondaryGroups.map((group) => (
          <Collapsible
            key={group.label}
            open={openGroups[group.label]}
            onOpenChange={() => toggleGroup(group.label)}
          >
            <SidebarGroup>
              {showContent && (
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span>{group.label}</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform text-gray-500 dark:text-gray-400",
                      openGroups[group.label] && "rotate-180"
                    )} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
              )}
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.value}>
                        <SidebarMenuButton
                          onClick={() => handleNavClick(item.value)}
                          isActive={isActive(item.value)}
                          tooltip={!showContent ? item.label : undefined}
                          className={cn(
                            "w-full justify-start text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800",
                            isActive(item.value) && "bg-primary/10 text-primary font-medium"
                          )}
                        >
                          <item.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          {showContent && <span className="ml-2 text-gray-800 dark:text-gray-100">{item.label}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-2 bg-white dark:bg-gray-900">
        {showContent && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Med-Infinite v1.0
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
