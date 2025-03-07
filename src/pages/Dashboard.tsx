
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { AdminsTable } from "@/components/AdminsTable";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Home, ListChecks, Settings, FileText, Briefcase, Heart, Brain, Stethoscope, List, Activity, Users } from "lucide-react";

// Navigation items
const navigationItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: ListChecks, label: "Key Parameters", path: "/parameters" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: FileText, label: "Agreement", path: "/agreement" },
  { icon: Briefcase, label: "Services", path: "/services" },
  { icon: Heart, label: "Hobbies", path: "/hobbies" },
  { icon: Brain, label: "Skills", path: "/skills" },
  { icon: Stethoscope, label: "Medical & Mental", path: "/medical-mental" },
  { icon: List, label: "Type of Work", path: "/type-of-work" },
  { icon: Activity, label: "Body Map Injuries", path: "/body-map-points" },
  { icon: FileText, label: "Branch", path: "/branch" },
  { icon: Users, label: "Branch Admin", path: "/branch-admins" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard"); // Set the active tab
  const [selectedNavItem, setSelectedNavItem] = useState("Home");
  
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
  
  const handleNavigationChange = (value: string) => {
    // Navigate to the appropriate page based on the selected tab
    if (value === "dashboard") {
      navigate("/dashboard");
    } else if (value === "task-matrix" || value === "training-matrix" || value === "form-matrix" || value === "medication") {
      navigate(`/workflow/${value}`);
    } else if (value === "workflow") {
      navigate("/workflow/task-matrix");
    } else {
      navigate(`/${value}`);
    }
  };

  const handleNavItemClick = (path: string, label: string) => {
    setSelectedNavItem(label);
    navigate(path);
  };
  
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
      <TabNavigation activeTab={activeTab} onChange={handleNavigationChange} />
      
      <motion.main 
        className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Navigation Cards - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {navigationItems.slice(0, 4).map((item) => (
            <div 
              key={item.label}
              className={`flex flex-col items-center justify-center py-6 px-4 rounded-xl shadow-sm cursor-pointer transition-all duration-200 ${
                selectedNavItem === item.label ? 'bg-blue-100 border-blue-200' : 'bg-white hover:bg-gray-50 border-gray-100'
              } border`}
              onClick={() => handleNavItemClick(item.path, item.label)}
            >
              {item.icon && <item.icon className="w-6 h-6 text-blue-600 mb-2" />}
              <span className="text-gray-700 font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Navigation Cards - Bottom Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          {navigationItems.slice(4).map((item) => (
            <div 
              key={item.label}
              className={`flex flex-col items-center justify-center py-6 px-4 rounded-xl shadow-sm cursor-pointer transition-all duration-200 ${
                selectedNavItem === item.label ? 'bg-blue-100 border-blue-200' : 'bg-white hover:bg-gray-50 border-gray-100'
              } border`}
              onClick={() => handleNavItemClick(item.path, item.label)}
            >
              {item.icon && <item.icon className="w-6 h-6 text-gray-600 mb-2" />}
              <span className="text-gray-700 font-medium text-center">{item.label}</span>
            </div>
          ))}
        </div>
        
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Branch Administrators</h1>
          <p className="text-gray-500 mt-2 font-medium">Manage and monitor all branch administrators.</p>
        </div>
        
        <AdminsTable />
      </motion.main>
    </div>
  );
};

export default Dashboard;
