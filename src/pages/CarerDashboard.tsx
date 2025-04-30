
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
      <CarerHeader />
      
      <div className="flex flex-1">
        <CarerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="md:hidden mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </Button>
          </div>
          
          {/* This renders the nested routes */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CarerDashboard;
