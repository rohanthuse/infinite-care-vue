
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { AdminsTable } from "@/components/AdminsTable";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // In a real app, you would check auth status here
  useEffect(() => {
    // Simulate checking auth status
    const timer = setTimeout(() => {
      setLoading(false);
      // If no auth, redirect: navigate('/super-admin');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-med-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader />
      <DashboardNavbar />
      
      <main className="flex-1 p-8 max-w-[1600px] w-full mx-auto">
        <AdminsTable />
      </main>
    </div>
  );
};

export default Dashboard;
