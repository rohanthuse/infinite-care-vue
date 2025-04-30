
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { CarerHeader } from "@/components/carer/CarerHeader";
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
              {/* Mobile navigation links will be added here */}
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
