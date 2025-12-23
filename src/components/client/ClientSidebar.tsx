import React, { useEffect } from "react";
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
  Bell,
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
  const { createClientPath, tenantSlug } = useClientNavigation();
  const { clientName: authClientName, user } = useClientAuth();
  const { open: sidebarOpen, isMobile, setOpenMobile } = useSidebar();

  // Log tenant context availability
  useEffect(() => {
    console.log('[ClientSidebar] TenantSlug:', tenantSlug);
  }, [tenantSlug]);

  // Get the display name from auth or fallback to email prefix or "Client"
  const clientName = authClientName || 
    (user?.email ? user.email.split('@')[0] : "Client");

  // Show text on mobile (Sheet is full-width) or when sidebar is expanded on desktop
  const showText = sidebarOpen || isMobile;

  // Handle navigation with auto-close on mobile
  const handleNavigation = (path: string) => {
    console.log('[ClientSidebar] Navigating to:', path, 'Current location:', location.pathname);
    navigate(path);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const mainItems = [
    { name: "Overview", path: createClientPath(""), icon: Home },
    { name: "My Schedule", path: createClientPath("/schedule"), icon: Calendar },
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
    { name: "Notifications", path: createClientPath("/notifications"), icon: Bell },
    { name: "Messages", path: createClientPath("/messages"), icon: MessageCircle },
    { name: "Profile", path: createClientPath("/profile"), icon: User },
    { name: "Support", path: createClientPath("/support"), icon: HelpCircle },
  ];

  const isActive = (path: string) => {
    // Normalize paths by removing trailing slashes
    const normalizedPath = path.replace(/\/$/, '');
    const normalizedLocation = location.pathname.replace(/\/$/, '');
    return normalizedLocation === normalizedPath;
  };

  return (
    <Sidebar
      side="right"
      collapsible="icon"
      className={cn(
        "border-l transition-all duration-300 ease-in-out shrink-0",
        sidebarOpen ? "w-64 lg:w-72" : "w-14"
      )}
    >
      <SidebarHeader className="border-b p-4 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/30 dark:from-indigo-950/30 dark:to-purple-950/20">
        {showText ? (
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-8 w-8 ring-2 ring-indigo-200 dark:ring-indigo-800">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {clientName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-foreground">{clientName}</span>
          </div>
        ) : (
          <Avatar className="h-8 w-8 mx-auto mb-2 ring-2 ring-indigo-200 dark:ring-indigo-800">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {clientName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <SidebarTrigger className={cn(!showText && "mx-auto")} />
      </SidebarHeader>

      <SidebarContent>
        {/* Main Group */}
        <SidebarGroup>
          {showText && <SidebarGroupLabel className="text-indigo-600 dark:text-indigo-400 font-semibold">Main</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={!showText ? item.name : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {showText && <span>{item.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Services Group */}
        <SidebarGroup>
          {showText && <SidebarGroupLabel className="text-purple-600 dark:text-purple-400 font-semibold">Services</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {servicesItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={!showText ? item.name : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {showText && <span>{item.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Personal Group */}
        <SidebarGroup>
          {showText && <SidebarGroupLabel className="text-blue-600 dark:text-blue-400 font-semibold">Personal</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {personalItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={!showText ? item.name : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {showText && <span>{item.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {showText && (
        <SidebarFooter className="border-t p-4 bg-gradient-to-r from-indigo-50/30 to-transparent dark:from-indigo-950/20">
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">Med-Infinite</div>
          <div className="text-xs text-muted-foreground">Version 1.0.0</div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};
