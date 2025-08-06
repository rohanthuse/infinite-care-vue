
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
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
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCarerAuth } from "@/hooks/useCarerAuth";
import { useCarerProfile } from "@/hooks/useCarerProfile";

const CarerDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading, signOut } = useCarerAuth();
  const { data: carerProfile } = useCarerProfile();

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
      name: "My Forms", 
      path: "/carer-dashboard/forms", 
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

  // Check authentication status - only redirect if truly unauthenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('[CarerDashboard] User not authenticated, redirecting to login');
      navigate("/carer-login");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleMobileLogout = async () => {
    try {
      await signOut();
      setSidebarOpen(false);
    } catch (error) {
      console.error('Mobile logout error:', error);
    }
  };

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

  const carerName = carerProfile ? `${carerProfile.first_name} ${carerProfile.last_name}` : "Carer";

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
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      location.pathname === item.path
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </Link>
                ))}
              </div>
              
              {/* Mobile profile section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{carerName}</p>
                    <p className="text-xs text-gray-500">Carer</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full flex justify-between items-center text-gray-700 hover:bg-gray-50"
                  onClick={handleMobileLogout}
                >
                  <span>Logout</span>
                  <LogOut className="h-4 w-4" />
                </Button>
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
