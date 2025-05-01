
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ClientSidebar from "@/components/ClientSidebar";
import ClientHeader from "@/components/ClientHeader";

const ClientDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pageTitle, setPageTitle] = useState("Overview");
  
  // Determine the page title based on the current route
  useEffect(() => {
    const path = location.pathname;
    
    if (path === "/client-dashboard") {
      setPageTitle("Overview");
    } else if (path.includes("/appointments")) {
      setPageTitle("Appointments");
    } else if (path.includes("/care-plans")) {
      setPageTitle("Care Plans");
    } else if (path.includes("/payments")) {
      setPageTitle("Payments");
    } else if (path.includes("/documents")) {
      setPageTitle("Documents");
    } else if (path.includes("/profile")) {
      setPageTitle("Profile");
    }
  }, [location]);
  
  // Redirect to overview page if no specific page is selected
  useEffect(() => {
    if (location.pathname === "/client-dashboard") {
      navigate("/client-dashboard", { replace: true });
    }
  }, [location, navigate]);
  
  // Verify client authentication
  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "client") {
      navigate("/client-login", { replace: true });
    }
  }, [navigate]);
  
  return (
    <div className="flex h-screen bg-gray-50">
      <ClientSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <ClientHeader title={pageTitle} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;
