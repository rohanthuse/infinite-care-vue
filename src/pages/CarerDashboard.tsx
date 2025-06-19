
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { CarerHeader } from "@/components/carer/CarerHeader";
import { 
  Menu, 
  Home, 
  User, 
  Calendar,
  CalendarDays,
  FileText,
  ClipboardList,
  Newspaper,
  FileBarChart, 
  Wallet, 
  GraduationCap,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCarerAuth } from "@/hooks/useCarerAuth";

const CarerDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useCarerAuth();

  // Menu items for mobile view
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
      name: "Care Plans", 
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
    { 
      name: "Clients", 
      path: "/carer-dashboard/clients", 
      icon: Users 
    }
  ];

  // Check authentication status
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('[CarerDashboard] User not authenticated, redirecting to login');
      navigate("/carer-login");
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <CarerHeader onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        {/* Mobile menu - will be shown when sidebarOpen is true */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
            <div className="fixed inset-y-0 left-0 w-64 bg-white p-4 overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Menu</h3>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Mobile navigation links */}
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.path}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      location.pathname === item.path || (item.path === "/carer-dashboard" && location.pathname === "/carer-dashboard")
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* This renders the nested routes */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CarerDashboard;
