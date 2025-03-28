
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, Workflow, ListChecks, Users, 
  Calendar, Star, MessageSquare, Pill, DollarSign, 
  FileText, ClipboardCheck, Bell, ClipboardList, 
  Menu, X, ChevronRight, Search, PanelLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

// Group items by category for better organization
const menuGroups = [
  {
    label: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "dashboard" },
      { icon: Calendar, label: "Bookings", path: "bookings" },
      { icon: Users, label: "Clients", path: "clients" },
      { icon: Users, label: "Carers", path: "carers" },
    ]
  },
  {
    label: "Operations",
    items: [
      { icon: Workflow, label: "Workflow", path: "workflow" },
      { icon: ListChecks, label: "Key Parameters", path: "key-parameters" },
      { icon: Pill, label: "Medication", path: "medication" },
      { icon: ClipboardList, label: "Care Plan", path: "care-plan" },
    ]
  },
  {
    label: "Communication",
    items: [
      { icon: Star, label: "Reviews", path: "reviews" },
      { icon: MessageSquare, label: "Messages", path: "communication" },
      { icon: Bell, label: "Notifications", path: "notifications" },
    ]
  },
  {
    label: "Admin",
    items: [
      { icon: DollarSign, label: "Accounting", path: "accounting" },
      { icon: FileText, label: "Agreements", path: "agreements" },
      { icon: ClipboardCheck, label: "Attendance", path: "attendance" },
    ]
  }
];

interface BranchSidebarProps {
  branchName: string;
}

export const BranchSidebar = ({ branchName }: BranchSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [searchText, setSearchText] = useState("");
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  
  const currentPath = location.pathname;
  const baseUrl = currentPath.split('/').slice(0, 4).join('/');
  
  const isActive = (path: string) => {
    return currentPath.includes(`${baseUrl}/${path}`);
  };

  const filteredGroups = searchText.trim() !== "" ? 
    menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.label.toLowerCase().includes(searchText.toLowerCase())
      )
    })).filter(group => group.items.length > 0) : 
    menuGroups;
  
  // Desktop sidebar
  const DesktopSidebar = () => (
    <motion.aside 
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "hidden md:flex fixed top-[4.5rem] left-0 bottom-0 bg-white border-r border-gray-200 z-30 flex-col",
        collapsed ? "w-20" : "w-70"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-20 bg-white p-3 border-b border-gray-100 flex justify-between items-center">
          {!collapsed && (
            <>
              <h2 className="text-lg font-bold text-gray-800 truncate">{branchName}</h2>
              <Input
                type="search"
                placeholder="Search modules..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full max-w-[180px] h-8 ml-2"
              />
            </>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCollapse} 
            className={cn("rounded-full hover:bg-gray-100", collapsed ? "ml-auto" : "")}
          >
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
        </div>
        
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-2">
            <TooltipProvider delayDuration={0}>
              {filteredGroups.map((group) => (
                <div key={group.label} className="mb-6">
                  {!collapsed && (
                    <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">{group.label}</h3>
                  )}
                  <nav className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      const itemPath = `${baseUrl}/${item.path}`;
                      
                      return (
                        <Tooltip key={item.label}>
                          <TooltipTrigger asChild>
                            <Link
                              to={itemPath}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                                active 
                                  ? "bg-blue-50 text-blue-600" 
                                  : "text-gray-700 hover:bg-gray-100",
                                collapsed && "justify-center"
                              )}
                            >
                              <Icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-gray-500")} />
                              {!collapsed && (
                                <span className="text-sm font-medium">{item.label}</span>
                              )}
                              {!collapsed && active && (
                                <ChevronRight className="ml-auto h-4 w-4 text-blue-600" />
                              )}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" hidden={!collapsed}>
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </TooltipProvider>
          </div>
        </ScrollArea>
        
        <div className={cn(
          "border-t border-gray-200 p-3",
          collapsed ? "text-center" : "px-4"
        )}>
          <div className={cn(
            "flex items-center text-xs text-gray-500",
            collapsed ? "flex-col" : "justify-between"
          )}>
            <span>Powered by</span>
            <span className="font-medium">Med-Infinite</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );

  // Mobile sidebar
  const MobileSidebar = () => (
    <div className="md:hidden">
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed top-[4.5rem] left-4 z-30 h-10 w-10 rounded-full bg-white shadow-md"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85%] max-w-[300px] pt-12 px-0">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 truncate">{branchName}</h2>
            <div className="mt-4 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search modules..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-8"
              />
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-180px)] py-4">
            {filteredGroups.map((group) => (
              <div key={group.label} className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">{group.label}</h3>
                <nav className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    const itemPath = `${baseUrl}/${item.path}`;
                    
                    return (
                      <Link
                        key={item.label}
                        to={itemPath}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                          active 
                            ? "bg-blue-50 text-blue-600" 
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-gray-500")} />
                        <span className="text-sm font-medium">{item.label}</span>
                        {active && (
                          <ChevronRight className="ml-auto h-4 w-4 text-blue-600" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </ScrollArea>
          
          <div className="border-t border-gray-200 p-4 mt-auto">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Powered by</span>
              <span className="font-medium">Med-Infinite</span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
  
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
};
