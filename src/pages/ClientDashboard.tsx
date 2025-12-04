
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ClientHeader from "@/components/ClientHeader";
import { ClientSidebar } from "@/components/client/ClientSidebar";
import { SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();
  const [pageTitle, setPageTitle] = useState("Overview");

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem("userType");
        localStorage.removeItem("clientName");
        localStorage.removeItem("clientId");
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);
  
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-50">
      <ClientHeader title={pageTitle} />
      
      <div 
        className="flex flex-1 min-h-0 w-full"
        style={{ paddingTop: 'var(--client-header-height, 64px)' }}
      >
        <SidebarInset className="flex-1 min-w-0 overflow-y-auto">
          <main className="w-full max-w-full min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <Outlet />
          </main>
        </SidebarInset>
        
        <ClientSidebar />
      </div>
    </div>
  );
};

export default ClientDashboard;
