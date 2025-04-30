
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Bell, 
  ChevronDown, 
  Heart,
  HelpCircle, 
  LogOut, 
  Menu, 
  Search,
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
import { CustomButton } from "@/components/ui/CustomButton";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
    <header className="bg-white shadow-sm border-b border-gray-100 py-3 md:py-4 sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 flex justify-between items-center relative">
        {/* Logo aligned to the left - with Heart icon to match Super Admin */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Heart className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <h2 className="text-base md:text-xl font-bold tracking-tight">
            Med-infinite 
          </h2>
        </div>
        
        {/* Search in center for desktop view */}
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
        
        {/* Bell notification on right for desktop view */}
        <div className="hidden md:flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 rounded-full relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="outline" size="icon" className="text-blue-600 border border-blue-200 bg-white shadow-sm hover:bg-blue-50 rounded-full" onClick={onMobileMenuToggle}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Profile card - styled like Super Admin */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm py-2 px-4 rounded-full border border-gray-100/60 shadow-sm ml-2">
            <div>
              <div className="text-gray-800 font-semibold">{carerName}</div>
              <div className="text-gray-500 text-xs font-medium">Carer</div>
            </div>
            <div className="h-8 border-r border-gray-200/80 mx-1"></div>
            <CustomButton variant="ghost" size="icon" className="flex items-center p-1.5 hover:bg-gray-100/80 text-gray-700 rounded-full transition-all" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </CustomButton>
          </div>
        </div>
      </div>
      
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
    </header>
  );
};
