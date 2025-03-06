
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Star, 
  Plus, 
  Filter, 
  MoreHorizontal,
  MessageCircle
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define the tab items with icons and labels
const tabItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
  },
  {
    id: "clients",
    label: "Clients",
    icon: <Users className="h-4 w-4 mr-2" />,
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: <Calendar className="h-4 w-4 mr-2" />,
  },
  {
    id: "carers",
    label: "Carers",
    icon: <Users className="h-4 w-4 mr-2" />,
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: <Star className="h-4 w-4 mr-2" />,
  },
  {
    id: "communications",
    label: "Communications",
    icon: <MessageCircle className="h-4 w-4 mr-2" />,
  },
];

// Define the mobile tab items (subset of main tabs for mobile view)
const mobileTabItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    id: "clients",
    label: "Clients",
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: <Calendar className="h-4 w-4" />,
  },
];

interface TabNavigationProps {
  activeTab: string;
  onChange: (tabId: string) => void;
  hideActionsOnMobile?: boolean;
  hideQuickAdd?: boolean;
}

export const TabNavigation = ({
  activeTab,
  onChange,
  hideActionsOnMobile = false,
  hideQuickAdd = false,
}: TabNavigationProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between">
      <div className="flex space-x-1 md:space-x-2 mb-3 md:mb-0 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
        {tabItems.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            className={`whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </Button>
        ))}
      </div>

      {!hideQuickAdd && (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            Filter
          </Button>
          <Button
            size="sm"
            className="hidden md:flex items-center bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Quick Add
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:hidden"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Filter className="h-3.5 w-3.5 mr-2" />
                Filter
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus className="h-3.5 w-3.5 mr-2" />
                Quick Add
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
