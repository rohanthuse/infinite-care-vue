
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { AdminsTable } from "@/components/AdminsTable";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // In a real app, you would check auth status here
  useEffect(() => {
    // Simulate checking auth status
    const timer = setTimeout(() => {
      setLoading(false);
      toast({
        title: "Welcome to Med-infinite Dashboard",
        description: "You have successfully logged in",
        duration: 3000,
      });
      // If no auth, redirect: navigate('/super-admin');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-med-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium tracking-wide">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      <DashboardNavbar />
      
      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl shadow-soft overflow-hidden transition-all duration-300 hover:shadow-medium border border-gray-100/60">
          <div className="p-8 border-b border-gray-100/60 bg-gradient-to-r from-white to-gray-50/50">
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Branch Administrators</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage and monitor all branch administrators.</p>
          </div>
          <AdminsTable />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
