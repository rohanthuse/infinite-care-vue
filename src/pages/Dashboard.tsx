
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { AdminsTable } from "@/components/AdminsTable";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Bell, ListChecks, BookText, FileText, ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium tracking-wide">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      <DashboardNavbar />
      
      <motion.main 
        className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Branch Administrators</h1>
          <p className="text-gray-500 mt-2 font-medium">Manage and monitor all branch administrators.</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-4">Workflow</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card 
              className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
              onClick={() => navigate('/notifications')}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Notification Overview</h3>
                <p className="text-sm text-gray-500 mt-1">System alerts and updates</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
              onClick={() => navigate('/tasks')}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <ListChecks className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Task Matrix</h3>
                <p className="text-sm text-gray-500 mt-1">Manage priority tasks</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
              onClick={() => navigate('/training')}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <BookText className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Training Matrix</h3>
                <p className="text-sm text-gray-500 mt-1">Staff development</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
              onClick={() => navigate('/forms')}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Form Matrix</h3>
                <p className="text-sm text-gray-500 mt-1">Document templates</p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <AdminsTable />
      </motion.main>
    </div>
  );
};

export default Dashboard;
