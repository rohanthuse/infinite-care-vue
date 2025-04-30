
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Bell, 
  ChevronDown, 
  HelpCircle, 
  LogOut, 
  Menu, 
  Settings, 
  User, 
  Calendar, 
  ClipboardList, 
  FileText, 
  Home, 
  Users, 
  Wallet, 
  GraduationCap,
  CalendarDays,
  FileBarChart,
  Newspaper,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const CarerHeader: React.FC<{ onMobileMenuToggle: () => void }> = ({ onMobileMenuToggle }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const carerName = localStorage.getItem("carerName") || "Carer";
  const location = useLocation();
  const [searchValue, setSearchValue] = useState("");
  
  const menuItems = [
    { 
      name: "Dashboard", 
      path: "/carer-dashboard", 
      icon: Home 
    },
    { 
      name: "Profile", 
      path: "/carer-dashboard/profile", 
      icon: User 
    },
    { 
      name: "Booking Calendar", 
      path: "/carer-dashboard/schedule", 
      icon: Calendar 
    },
    { 
      name: "Appointments", 
      path: "/carer-dashboard/appointments", 
      icon: CalendarDays 
    },
    { 
      name: "Careplans", 
      path: "/carer-dashboard/careplans", 
      icon: FileText 
    },
    { 
      name: "Tasks", 
      path: "/carer-dashboard/tasks", 
      icon: ClipboardList 
    },
    { 
      name: "News2", 
      path: "/carer-dashboard/news2", 
      icon: Newspaper 
    },
    { 
      name: "Reports", 
      path: "/carer-dashboard/reports", 
      icon: FileBarChart 
    },
    { 
      name: "Payments", 
      path: "/carer-dashboard/payments", 
      icon: Wallet 
    },
    { 
      name: "Training", 
      path: "/carer-dashboard/training", 
      icon: GraduationCap 
    },
  ];

  const handleLogout = () => {
    // Clear auth state
    localStorage.removeItem("userType");
    localStorage.removeItem("carerName");
    
    toast({
      title: "Logged out successfully",
      description: "You have been logged out.",
    });
    
    navigate("/carer-login");
  };

  return (
    <div className="flex flex-col">
      <header className="bg-white border-b border-gray-200 py-3 px-4 sticky top-0 z-50 w-full">
        <div className="container mx-auto px-4 flex justify-between items-center relative">
          {/* Left section with logo and menu toggle */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onMobileMenuToggle}>
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">
                <User className="h-4 w-4 md:h-5 md:h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">
                  Med-Infinite
                </h1>
                <p className="text-sm text-gray-500">Carer Dashboard</p>
              </div>
            </div>
          </div>
          
          {/* Center section with search */}
          <div className="hidden md:flex items-center justify-center flex-1 mx-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 rounded-full bg-white border-gray-200 w-full transition-all duration-300"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>
          
          {/* Right section with actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></div>
            </Button>
            
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    {carerName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline-block">{carerName}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start p-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">
                    {carerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{carerName}</p>
                    <p className="text-xs text-gray-500">Carer</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Navigation Menu - Styled to match DashboardNavbar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100/40 py-2 px-4 hidden md:block">
        <nav className="container mx-auto">
          <div className="flex flex-wrap justify-between">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                  location.pathname === item.path || (item.path === "/carer-dashboard" && location.pathname === "/carer-dashboard")
                    ? "bg-blue-50 text-blue-700 before:absolute before:bottom-0 before:left-0 before:w-full before:h-0.5 before:bg-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                )}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};
