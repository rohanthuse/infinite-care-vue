
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ClientHeader from "@/components/ClientHeader";
import { 
  Home, Calendar, FileText, 
  CreditCard, User, File, MessageCircle, Star,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const ClientDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pageTitle, setPageTitle] = useState("Overview");
  
  // Menu items for top navigation
  const menuItems = [
    { label: "Overview", icon: Home, path: "/client-dashboard" },
    { label: "Appointments", icon: Calendar, path: "/client-dashboard/appointments" },
    { label: "Care Plans", icon: FileText, path: "/client-dashboard/care-plans" },
    { label: "Reviews", icon: Star, path: "/client-dashboard/reviews" },
    { label: "Payments", icon: CreditCard, path: "/client-dashboard/payments" },
    { label: "Documents", icon: File, path: "/client-dashboard/documents" },
    { label: "Messages", icon: MessageCircle, path: "/client-dashboard/messages" },
    { label: "Profile", icon: User, path: "/client-dashboard/profile" },
    { label: "Support", icon: HelpCircle, path: "/client-dashboard/support" }
  ];
  
  // Determine the page title based on the current route
  useEffect(() => {
    const path = location.pathname;
    
    if (path === "/client-dashboard") {
      setPageTitle("Overview");
    } else if (path.includes("/appointments")) {
      setPageTitle("Appointments");
    } else if (path.includes("/care-plans")) {
      setPageTitle("Care Plans");
    } else if (path.includes("/reviews")) {
      setPageTitle("Reviews");
    } else if (path.includes("/payments")) {
      setPageTitle("Payments");
    } else if (path.includes("/documents")) {
      setPageTitle("Documents");
    } else if (path.includes("/messages")) {
      setPageTitle("Messages");
    } else if (path.includes("/profile")) {
      setPageTitle("Profile");
    } else if (path.includes("/support")) {
      setPageTitle("Help & Support");
    }
  }, [location]);
  
  // Fix: Only redirect if directly at /client-dashboard WITHOUT a trailing slash
  useEffect(() => {
    // Check if we're exactly at /client-dashboard with no children routes
    if (location.pathname === "/client-dashboard" && location.pathname.split("/").filter(Boolean).length === 1) {
      // Navigate to the overview page
      navigate("/client-dashboard", { replace: true });
    }
  }, []); // Run only once on component mount
  
  // Verify client authentication
  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "client") {
      navigate("/client-login", { replace: true });
    }
  }, []); // Run only once on component mount
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ClientHeader title={pageTitle} />
      
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-4 hidden md:block">
        <nav className="flex flex-wrap">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                location.pathname === item.path || (item.path === "/client-dashboard" && location.pathname === "/client-dashboard")
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-700 hover:text-blue-600 hover:border-blue-200"
              )}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      
      {/* Mobile Navigation Menu */}
      <div className="md:hidden bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center py-3 px-3 min-w-[80px] text-xs font-medium border-b-2 transition-colors",
                location.pathname === item.path || (item.path === "/client-dashboard" && location.pathname === "/client-dashboard")
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-700 hover:text-blue-600 hover:border-blue-200"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default ClientDashboard;
