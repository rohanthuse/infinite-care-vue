
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CustomButton } from "@/components/ui/CustomButton";
import { LogOut } from "lucide-react";

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
  
  const handleLogout = () => {
    // Clear auth state/tokens here
    navigate('/super-admin');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <CustomButton 
            variant="outline" 
            className="flex items-center"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </CustomButton>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to the Admin Control Panel</h2>
          <p className="text-gray-600">
            This is a placeholder dashboard. In a real application, you would see admin controls,
            statistics, and management tools here.
          </p>
          
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Sample dashboard cards */}
            {["User Management", "Content Management", "System Settings", "Analytics", "Permissions", "Logs"].map((item) => (
              <div key={item} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:border-blue-600 transition-colors">
                <h3 className="font-medium">{item}</h3>
                <p className="text-sm text-gray-500 mt-1">Manage {item.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
