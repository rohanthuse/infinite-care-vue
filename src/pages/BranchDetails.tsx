import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { motion } from "framer-motion";
import { 
  Building2, Calendar, Users, FileText, Clock, 
  BarChart4, AlertCircle, Clipboard, ArrowLeft, UserCog,
  LayoutDashboard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const BranchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [branchData, setBranchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("branchDetails");

  useEffect(() => {
    const fetchBranchData = () => {
      setLoading(true);
      setTimeout(() => {
        const mockBranches = [
          { 
            id: "1", 
            title: "Med-Infinite Health Care Services- Milton Keynes", 
            country: "England", 
            currency: "£", 
            regulatory: "CQC", 
            branchType: "HomeCare", 
            createdOn: "01/01/0001", 
            createdBy: "System", 
            status: "Active",
            stats: {
              carers: 15,
              clients: 32,
              bookings: 124,
              reviews: 28,
            }
          },
          { 
            id: "2", 
            title: "Med-Infinite Health Care Services- Hampshire", 
            country: "England", 
            currency: "£", 
            regulatory: "CQC", 
            branchType: "HomeCare", 
            createdOn: "06/01/2025", 
            createdBy: "Laniyan, Aderinsola", 
            status: "Active",
            stats: {
              carers: 8,
              clients: 17,
              bookings: 56,
              reviews: 12,
            }
          },
        ];
        
        const branch = mockBranches.find(b => b.id === id);
        setBranchData(branch || mockBranches[0]);
        setLoading(false);
      }, 800);
    };

    fetchBranchData();
  }, [id]);

  const handleNavigateToBranchAdmins = () => {
    toast.success("Navigating to Branch Admins dashboard");
    navigate('/branch-admins');
  };

  const handleNavigateToBranchDashboard = () => {
    toast.success("Navigating to Branch Dashboard");
    if (branchData) {
      navigate(`/branch-dashboard/${branchData.id}/${encodeURIComponent(branchData.title)}`);
    }
  };

  const handleNavigationChange = (value: string) => {
    setActiveTab(value);
  };

  const StatCard = ({ icon: Icon, title, value, color }: { icon: any, title: string, value: number | string, color: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex flex-col`}>
      <div className="flex items-center mb-2">
        <div className={`p-2 rounded-md ${color} mr-3`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      <TabNavigation activeTab={activeTab} onChange={handleNavigationChange} />
      
      <motion.main 
        className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex items-start gap-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="rounded-full border-gray-200"
                  onClick={() => navigate('/branch')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">{branchData.title}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800 font-medium border-0 rounded-full px-3">
                      {branchData.status}
                    </Badge>
                    <span className="text-gray-500 text-sm">
                      {branchData.branchType} | {branchData.country} | {branchData.regulatory}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="rounded-md border-gray-200 flex items-center gap-2"
                  onClick={handleNavigateToBranchDashboard}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Branch Dashboard
                </Button>
                <Button 
                  variant="outline"
                  className="rounded-md border-gray-200 flex items-center gap-2"
                  onClick={handleNavigateToBranchAdmins}
                >
                  <UserCog className="h-4 w-4" />
                  Branch Admins
                </Button>
                <Button variant="outline" className="rounded-md border-gray-200">
                  Edit Branch
                </Button>
                <CustomButton className="bg-blue-600 hover:bg-blue-700">
                  Manage Carers
                </CustomButton>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard 
                icon={Users} 
                title="Carers" 
                value={branchData.stats.carers} 
                color="bg-blue-600" 
              />
              <StatCard 
                icon={Users} 
                title="Clients" 
                value={branchData.stats.clients} 
                color="bg-green-600" 
              />
              <StatCard 
                icon={Calendar} 
                title="Total Bookings" 
                value={branchData.stats.bookings} 
                color="bg-purple-600" 
              />
              <StatCard 
                icon={FileText} 
                title="Reviews" 
                value={branchData.stats.reviews} 
                color="bg-amber-600" 
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <BarChart4 className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">Weekly Statistics</h2>
                </div>
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-gray-500">Bar chart to be implemented</p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">Today's Bookings</h2>
                </div>
                <div className="mt-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">Charuma, Charmaine</p>
                          <p className="text-xs text-gray-500">Client: Pender, Eva</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700">09:00 - 10:30</div>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">Expiry Alerts</h2>
                </div>
                <div className="mt-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-full">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">Warren, Susan</p>
                          <p className="text-xs text-gray-500">
                            {i === 0 ? "NI Number" : i === 1 ? "Bank Details" : "Employment Reference"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        Expired
                      </Badge>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Clipboard className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">Latest Reviews</h2>
                </div>
                <div className="mt-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-full">
                          <Users className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium">Pender, Eva</p>
                          <p className="text-xs text-gray-500">Carer: Warren, Susan</p>
                        </div>
                      </div>
                      <div className="flex text-amber-500">
                        {Array(5).fill(0).map((_, j) => (
                          <span key={j}>★</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </motion.main>
    </div>
  );
};

export default BranchDetails;
