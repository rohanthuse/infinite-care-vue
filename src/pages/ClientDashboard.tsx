
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ClientHeader from "@/components/ClientHeader";
import { 
  Home, Calendar, FileText, 
  CreditCard, User, File, MessageCircle, Star,
  HelpCircle, BarChart, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";

const ClientDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenantSlug } = useTenant();
  const [pageTitle, setPageTitle] = useState("Overview");
  const [isLoading, setIsLoading] = useState(true);
  
  // Generate tenant-aware menu items
  const menuItems = [
    { label: "Overview", icon: Home, path: `/${tenantSlug}/client-dashboard` },
    { label: "Appointments", icon: Calendar, path: `/${tenantSlug}/client-dashboard/appointments` },
    { label: "Care Plans", icon: FileText, path: `/${tenantSlug}/client-dashboard/care-plans` },
    { label: "My Forms", icon: FileText, path: `/${tenantSlug}/client-dashboard/forms` },
    { label: "Reviews", icon: Star, path: `/${tenantSlug}/client-dashboard/reviews` },
    { label: "Payments", icon: CreditCard, path: `/${tenantSlug}/client-dashboard/payments` },
    { label: "Documents", icon: File, path: `/${tenantSlug}/client-dashboard/documents` },
    { label: "Service Reports", icon: BarChart, path: `/${tenantSlug}/client-dashboard/service-reports` },
    { label: "Health Monitoring", icon: Activity, path: `/${tenantSlug}/client-dashboard/health-monitoring` },
    { label: "Messages", icon: MessageCircle, path: `/${tenantSlug}/client-dashboard/messages` },
    { label: "Profile", icon: User, path: `/${tenantSlug}/client-dashboard/profile` },
    { label: "Support", icon: HelpCircle, path: `/${tenantSlug}/client-dashboard/support` }
  ];
  
  // Determine the page title based on the current route
  useEffect(() => {
    const path = location.pathname;
    
    if (path === `/${tenantSlug}/client-dashboard` || path.endsWith("/client-dashboard")) {
      setPageTitle("Overview");
    } else if (path.includes("/appointments")) {
      setPageTitle("Appointments");
    } else if (path.includes("/care-plans")) {
      setPageTitle("Care Plans");
    } else if (path.includes("/forms")) {
      setPageTitle("My Forms");
    } else if (path.includes("/reviews")) {
      setPageTitle("Reviews");
    } else if (path.includes("/payments")) {
      setPageTitle("Payments");
    } else if (path.includes("/documents")) {
      setPageTitle("Documents");
    } else if (path.includes("/service-reports")) {
      setPageTitle("Service Reports");
    } else if (path.includes("/health-monitoring")) {
      setPageTitle("Health Monitoring");
    } else if (path.includes("/messages")) {
      setPageTitle("Messages");
    } else if (path.includes("/profile")) {
      setPageTitle("Profile");
    } else if (path.includes("/support")) {
      setPageTitle("Help & Support");
    }
  }, [location, tenantSlug]);
  
  // Verify client authentication using centralized auth
  useEffect(() => {
    const checkClientAuth = async () => {
      try {
        // Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // No session, redirect to login
          localStorage.removeItem("userType");
          localStorage.removeItem("clientName");
          localStorage.removeItem("clientId");
          navigate(`/${tenantSlug}/client-login`, { replace: true });
          return;
        }

        // Verify the user is actually a client in our database
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, status')
          .eq('email', session.user.email)
          .single();

        if (error || !clientData) {
          console.error('Client verification failed:', error);
          await supabase.auth.signOut();
          localStorage.removeItem("userType");
          localStorage.removeItem("clientName");
          localStorage.removeItem("clientId");
          toast({
            title: "Access Denied",
            description: "You are not authorized to access this area.",
            variant: "destructive",
          });
          navigate(`/${tenantSlug}/client-login`, { replace: true });
          return;
        }

        // Status check removed - allow clients to access dashboard regardless of status

        // Update local storage with current client info
        localStorage.setItem("clientName", clientData.first_name);
        localStorage.setItem("clientId", clientData.id);
        
      } catch (error) {
        console.error('Auth check error:', error);
        navigate(`/${tenantSlug}/client-login`, { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkClientAuth();
  }, [navigate, toast]);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem("userType");
        localStorage.removeItem("clientName");
        localStorage.removeItem("clientId");
        navigate(`/${tenantSlug}/client-login`, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);
  
  // Fix: Only redirect if directly at /tenantSlug/client-dashboard with no children routes
  useEffect(() => {
    // Check if we're exactly at the tenant client dashboard with no children routes
    const expectedBasePath = `/${tenantSlug}/client-dashboard`;
    if (location.pathname === expectedBasePath) {
      // Navigate to the overview page (stay at same path since index route handles it)
      // No need to navigate, the index route will handle showing the overview
    }
  }, [tenantSlug]); // Run when tenant slug changes
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
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
                location.pathname === item.path || (item.path === `/${tenantSlug}/client-dashboard` && location.pathname === `/${tenantSlug}/client-dashboard`)
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
                location.pathname === item.path || (item.path === `/${tenantSlug}/client-dashboard` && location.pathname === `/${tenantSlug}/client-dashboard`)
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
