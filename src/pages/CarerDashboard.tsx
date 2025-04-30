
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { CarerHeader } from "@/components/carer/CarerHeader";
import { CarerSidebar } from "@/components/carer/CarerSidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const CarerDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Check if user is authorized as a carer
  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "carer") {
      navigate("/carer-login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <CarerHeader onMobileMenuToggle={() => setSidebarOpen(true)} />
      
      <div className="flex flex-1">
        {/* Mobile sidebar - only visible on mobile when open */}
        <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? "block" : "hidden"}`}>
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
          <CarerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* This renders the nested routes */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CarerDashboard;
