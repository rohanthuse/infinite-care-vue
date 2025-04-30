import React from "react";
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
  Newspaper
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onMobileMenuToggle}>
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">
                Welcome, {carerName}
              </h1>
              <p className="text-sm text-gray-500">Carer Dashboard</p>
            </div>
          </div>
        </div>
        
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
            <DropdownMenuContent align="end">
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
      </header>
      
      {/* Top Navigation Menu */}
      <div className="bg-white border-b border-gray-200 px-4 hidden md:block">
        <nav className="flex flex-wrap">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                location.pathname === item.path || (item.path === "/carer-dashboard" && location.pathname === "/carer-dashboard")
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-700 hover:text-blue-600 hover:border-blue-200"
              )}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};
