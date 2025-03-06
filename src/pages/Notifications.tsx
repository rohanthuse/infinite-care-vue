
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Bell, Users, User, Calendar, Pill, FileText, 
  AlertTriangle, CheckCircle, RefreshCw, Filter,
  ChevronDown, Eye
} from "lucide-react";
import { TabNavigation } from "@/components/TabNavigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchSidebar } from "@/components/BranchSidebar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface NotificationCategory {
  id: string;
  title: string;
  count: number;
  notConfirmed: number;
  unread: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  shadowColor: string;
}

const Notifications = () => {
  const { id, branchName } = useParams<{ id: string; branchName: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("notifications");
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();
  
  const notificationCategories: NotificationCategory[] = [
    {
      id: "staff",
      title: "Staff",
      count: 54,
      notConfirmed: 54,
      unread: 190,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      shadowColor: "shadow-blue-200/50"
    },
    {
      id: "client",
      title: "Client",
      count: 88,
      notConfirmed: 88,
      unread: 88,
      icon: User,
      color: "text-green-600",
      bgColor: "bg-green-50",
      shadowColor: "shadow-green-200/50"
    },
    {
      id: "rota",
      title: "Rota",
      count: 123,
      notConfirmed: 123,
      unread: 1108,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      shadowColor: "shadow-blue-200/50"
    },
    {
      id: "medication",
      title: "Medication",
      count: 82,
      notConfirmed: 82,
      unread: 82,
      icon: Pill,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      shadowColor: "shadow-rose-200/50"
    },
    {
      id: "reports",
      title: "Reports",
      count: 0,
      notConfirmed: 0,
      unread: 0,
      icon: FileText,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      shadowColor: "shadow-gray-200/50"
    },
    {
      id: "rotaErrors",
      title: "Rota Errors",
      count: 1,
      notConfirmed: 1,
      unread: 9,
      icon: AlertTriangle,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      shadowColor: "shadow-rose-200/50"
    }
  ];
  
  const handleRefresh = () => {
    toast({
      title: "Refreshing notifications",
      description: "Fetching the latest notification data",
      duration: 3000,
    });
  };
  
  const handleMarkAllRead = () => {
    toast({
      title: "Marked all as read",
      description: "All notifications have been marked as read",
      duration: 3000,
    });
  };
  
  const handleCategoryClick = (categoryId: string) => {
    // Fix the navigation path to use the actual id and branchName values, not the parameter names
    if (id && branchName) {
      navigate(`/branch-dashboard/${id}/${branchName}/notifications/${categoryId}`);
    } else {
      // Handle the case when accessed from the main notifications page
      navigate(`/notifications/${categoryId}`);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <BranchSidebar branchName={branchName || "Branch"} />
      <div className="flex-1">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-6">
          <TabNavigation activeTab={tab} onChange={(value) => setTab(value)} />
          
          <div className="mt-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Bell className="h-8 w-8 text-blue-600" />
                  Notification Overview
                </h1>
                <p className="text-gray-500 mt-2">
                  Manage and monitor all notifications from different categories
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>{filter === "all" ? "All Notifications" : 
                             filter === "unread" ? "Unread" : 
                             filter === "notConfirmed" ? "Not Confirmed" : filter}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setFilter("all")}>
                      All Notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter("unread")}>
                      Unread
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter("notConfirmed")}>
                      Not Confirmed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant="ghost" className="gap-2" onClick={handleMarkAllRead}>
                  <CheckCircle className="h-4 w-4" />
                  <span>Mark All Read</span>
                </Button>
                
                <Button variant="ghost" className="gap-2" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
            
            <div className="mb-6">
              <Tabs defaultValue="grid" className="w-full">
                <TabsList className="grid w-40 grid-cols-2">
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notificationCategories.map((category) => (
                <motion.div
                  key={category.id}
                  whileHover={{ y: -5, boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1)" }}
                  className={`relative overflow-hidden rounded-xl ${category.bgColor} border border-${category.color.replace('text-', '')}-100 shadow-lg ${category.shadowColor} p-6`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20 blur-2xl"></div>
                  <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-white/20 blur-2xl"></div>
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-full ${category.bgColor} border border-${category.color.replace('text-', '')}-200 flex items-center justify-center mb-4`}>
                      <category.icon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-white/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({
                          title: `Viewing ${category.title} details`,
                          duration: 2000,
                        });
                      }}
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-800">{category.title}</h3>
                  
                  <div className="mt-3 flex items-end gap-2">
                    <span className={`text-5xl font-bold ${category.count === 0 ? 'text-gray-400' : category.color}`}>
                      {category.count}
                    </span>
                    <Badge variant="outline" className="mb-1 bg-white/50 border-0">
                      Total
                    </Badge>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-500">Not Confirmed</div>
                      <div className={`text-xl font-semibold ${category.count === 0 ? 'text-gray-400' : category.color}`}>
                        {category.notConfirmed}
                      </div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-500">Unread</div>
                      <div className={`text-xl font-semibold ${category.count === 0 ? 'text-gray-400' : category.color}`}>
                        {category.unread}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
