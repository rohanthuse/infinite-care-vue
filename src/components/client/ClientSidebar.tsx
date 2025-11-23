import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Calendar,
  ClipboardList,
  FileText,
  ScrollText,
  BookOpen,
  AlertTriangle,
  Star,
  CreditCard,
  File,
  BarChart,
  Activity,
  MessageCircle,
  User,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useClientNavigation } from "@/hooks/useClientNavigation";
import { useClientAuth } from "@/hooks/useClientAuth";

export const ClientSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { createClientPath } = useClientNavigation();
  const { clientName: authClientName, user } = useClientAuth();
  const { open: sidebarOpen } = useSidebar();

  // Get the display name from auth or fallback to email prefix or "Client"
  const clientName = authClientName || 
    (user?.email ? user.email.split('@')[0] : "Client");

  const mainItems = [
    { name: "Overview", path: createClientPath(""), icon: Home },
    { name: "Appointments", path: createClientPath("/appointments"), icon: Calendar },
    { name: "Tasks", path: createClientPath("/tasks"), icon: ClipboardList },
    { name: "Care Plans", path: createClientPath("/care-plans"), icon: FileText },
  ];

  const servicesItems = [
    { name: "My Forms", path: createClientPath("/forms"), icon: FileText },
    { name: "My Agreements", path: createClientPath("/agreements"), icon: ScrollText },
    { name: "Library", path: createClientPath("/library"), icon: BookOpen },
    { name: "Events & Logs", path: createClientPath("/events-logs"), icon: AlertTriangle },
    { name: "Feedbacks", path: createClientPath("/reviews"), icon: Star },
    { name: "Service Reports", path: createClientPath("/service-reports"), icon: BarChart },
    { name: "Health Monitoring", path: createClientPath("/health-monitoring"), icon: Activity },
  ];

  const personalItems = [
    { name: "Payments", path: createClientPath("/payments"), icon: CreditCard },
    { name: "Documents", path: createClientPath("/documents"), icon: File },
    { name: "Messages", path: createClientPath("/messages"), icon: MessageCircle },
    { name: "Profile", path: createClientPath("/profile"), icon: User },
    { name: "Support", path: createClientPath("/support"), icon: HelpCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar
      side="right"
      collapsible="icon"
      className={cn(
        "border-l transition-all duration-300 z-50",
        sidebarOpen ? "w-72" : "w-14"
      )}
    >
      <SidebarHeader className="border-b p-4">
        {sidebarOpen ? (
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {clientName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold">{clientName}</span>
          </div>
        ) : (
          <Avatar className="h-8 w-8 mx-auto mb-2">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {clientName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <SidebarTrigger className={cn(!sidebarOpen && "mx-auto")} />
      </SidebarHeader>

      <SidebarContent>
        {/* Main Group */}
        <SidebarGroup>
          {sidebarOpen && <SidebarGroupLabel>Main</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={!sidebarOpen ? item.name : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {sidebarOpen && <span>{item.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Services Group */}
        <SidebarGroup>
          {sidebarOpen && <SidebarGroupLabel>Services</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {servicesItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={!sidebarOpen ? item.name : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {sidebarOpen && <span>{item.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Personal Group */}
        <SidebarGroup>
          {sidebarOpen && <SidebarGroupLabel>Personal</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {personalItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={!sidebarOpen ? item.name : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {sidebarOpen && <span>{item.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {sidebarOpen && (
        <SidebarFooter className="border-t p-4">
          <div className="text-xs text-muted-foreground mb-1">Med-Infinite</div>
          <div className="text-xs text-muted-foreground">Version 1.0.0</div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};
