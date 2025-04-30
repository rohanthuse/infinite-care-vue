
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { CarerHeader } from "@/components/carer/CarerHeader";
import { Menu, Home, User, Calendar, CalendarDays, FileText, ClipboardList, Newspaper, FileBarChart, Wallet, GraduationCap, Users, Search, Filter, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CarerDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Menu items for mobile view
  const menuItems = [{
    name: "Dashboard",
    path: "/carer-dashboard",
    icon: Home
  }, {
    name: "Profile",
    path: "/carer-dashboard/profile",
    icon: User
  }, {
    name: "Booking Calendar",
    path: "/carer-dashboard/schedule",
    icon: Calendar
  }, {
    name: "Appointments",
    path: "/carer-dashboard/appointments",
    icon: CalendarDays
  }, {
    name: "Careplans",
    path: "/carer-dashboard/careplans",
    icon: FileText
  }, {
    name: "Tasks",
    path: "/carer-dashboard/tasks",
    icon: ClipboardList
  }, {
    name: "News2",
    path: "/carer-dashboard/news2",
    icon: Newspaper
  }, {
    name: "Reports",
    path: "/carer-dashboard/reports",
    icon: FileBarChart
  }, {
    name: "Payments",
    path: "/carer-dashboard/payments",
    icon: Wallet
  }, {
    name: "Training",
    path: "/carer-dashboard/training",
    icon: GraduationCap
  }, {
    name: "Clients",
    path: "/carer-dashboard/clients",
    icon: Users
  }];

  // Check if user is authorized as a carer
  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "carer") {
      navigate("/carer-login");
    }
  }, [navigate]);
  
  return <div className="min-h-screen flex flex-col bg-gray-50">
      <CarerHeader onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        {/* Mobile menu - will be shown when sidebarOpen is true */}
        {sidebarOpen && <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
            <div className="fixed inset-y-0 left-0 w-64 bg-white p-4 overflow-auto">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Med-Infinite</h3>
                    <p className="text-xs text-gray-500">Carer Portal</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Mobile search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search..." className="pl-9 pr-4" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
              </div>
              
              {/* Mobile navigation links */}
              <div className="space-y-1">
                {menuItems.map(item => <Link key={item.name} to={item.path} className={cn("flex items-center px-3 py-2 text-sm font-medium rounded-md", location.pathname === item.path || item.path === "/carer-dashboard" && location.pathname === "/carer-dashboard" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100")} onClick={() => setSidebarOpen(false)}>
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </Link>)}
              </div>

              {/* Mobile bottom actions */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4 bg-white">
                <Button variant="outline" className="w-full justify-start text-gray-700" onClick={() => {
              localStorage.removeItem("userType");
              localStorage.removeItem("carerName");
              toast({
                title: "Logged out successfully"
              });
              navigate("/carer-login");
            }}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </div>
            </div>
          </div>}
        
        <main className="flex-1 p-4 md:p-6 lg:container lg:mx-auto overflow-auto">
          {/* Page Content */}
          
          
          {/* This renders the nested routes */}
          <Outlet />
        </main>
      </div>
    </div>;
};
export default CarerDashboard;
