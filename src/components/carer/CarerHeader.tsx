
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Bell, User, LogOut, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCarerAuth } from "@/hooks/useCarerAuth";

interface CarerHeaderProps {
  onMobileMenuToggle: () => void;
}

export const CarerHeader: React.FC<CarerHeaderProps> = ({ onMobileMenuToggle }) => {
  const location = useLocation();
  const { carerProfile, signOut } = useCarerAuth();

  const navigationItems = [
    { name: "Dashboard", path: "/carer-dashboard" },
    { name: "Profile", path: "/carer-dashboard/profile" },
    { name: "Schedule", path: "/carer-dashboard/schedule" },
    { name: "Appointments", path: "/carer-dashboard/appointments" },
    { name: "Care Plans", path: "/carer-dashboard/careplans" },
    { name: "Tasks", path: "/carer-dashboard/tasks" },
    { name: "Reports", path: "/carer-dashboard/reports" },
    { name: "Payments", path: "/carer-dashboard/payments" },
    { name: "Training", path: "/carer-dashboard/training" },
    { name: "Clients", path: "/carer-dashboard/clients" },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const carerName = carerProfile ? `${carerProfile.first_name} ${carerProfile.last_name}` : "Carer";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left section - Logo and Mobile Menu */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">Med-Infinite</span>
          </div>
        </div>

        {/* Center section - Desktop Navigation */}
        <nav className="hidden md:flex space-x-1">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                location.pathname === item.path
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right section - User menu */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2 border-l pl-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{carerName}</p>
              <p className="text-xs text-gray-500">Carer</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
