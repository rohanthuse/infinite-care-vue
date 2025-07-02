
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { AdminsTable } from "@/components/AdminsTable";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, loading, error } = useAuth();
  const [authTimeout, setAuthTimeout] = useState(false);

  console.log('Dashboard - Auth state:', { session: !!session, loading, error });

  // Redirect to super admin login if not authenticated
  useEffect(() => {
    console.log('Dashboard - Auth effect triggered:', { session: !!session, loading });
    
    if (!loading && !session) {
      console.log('Dashboard - Redirecting to super-admin login');
      navigate("/super-admin");
    }
  }, [session, loading, navigate]);

  // Set a timeout for authentication check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log('Dashboard - Auth timeout reached');
        setAuthTimeout(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [loading]);

  // Show loading while checking auth
  if (loading && !authTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if authentication failed
  if (error || authTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">
              {error ? error : 'Authentication is taking longer than expected. Please try logging in again.'}
            </p>
            <button 
              onClick={() => navigate('/super-admin')} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <DashboardNavbar />
        
        <motion.main 
          className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Branch Administrators</h1>
              <p className="text-gray-500 mt-2 font-medium">Manage and monitor all branch administrators.</p>
            </div>
          </div>
          
          <ErrorBoundary>
            <AdminsTable />
          </ErrorBoundary>
        </motion.main>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
