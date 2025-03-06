
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  Bell, Users, User, Calendar, Pill, FileText, 
  AlertTriangle, CheckCircle, RefreshCw, Filter,
  ChevronDown, Eye, Clock, AlertCircle
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";

interface NotificationCategory {
  id: string;
  title: string;
  count: number;
  notConfirmed: number;
  unread: number;
  icon: React.ElementType;
  color: string;
  description: string;
  priority: "high" | "medium" | "low"; 
}

const Notifications = () => {
  const { id, branchName, categoryId } = useParams<{ id: string; branchName: string; categoryId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState("notifications");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("grid");
  const { toast } = useToast();
  
  // Determine if we're in branch context
  const isInBranchContext = location.pathname.includes('/branch-dashboard/');
  
  const notificationCategories: NotificationCategory[] = [
    {
      id: "staff",
      title: "Staff Notifications",
      count: 54,
      notConfirmed: 12,
      unread: 42,
      icon: Users,
      color: "text-blue-600",
      description: "Updates related to staff scheduling, training, and performance",
      priority: "medium"
    },
    {
      id: "client",
      title: "Client Notifications",
      count: 88,
      notConfirmed: 23,
      unread: 65,
      icon: User,
      color: "text-green-600",
      description: "Updates on client appointments, requests, and feedback",
      priority: "high"
    },
    {
      id: "rota",
      title: "Rota Updates",
      count: 123,
      notConfirmed: 35,
      unread: 88,
      icon: Calendar,
      color: "text-indigo-600",
      description: "Changes to staff schedules and shift assignments",
      priority: "high"
    },
    {
      id: "medication",
      title: "Medication Alerts",
      count: 82,
      notConfirmed: 54,
      unread: 28,
      icon: Pill,
      color: "text-rose-600",
      description: "Medication schedules, updates, and stock alerts",
      priority: "high"
    },
    {
      id: "reports",
      title: "Reports",
      count: 12,
      notConfirmed: 5,
      unread: 7,
      icon: FileText,
      color: "text-gray-600",
      description: "Generated reports and analysis ready for review",
      priority: "low"
    },
    {
      id: "rotaErrors",
      title: "Rota Errors",
      count: 9,
      notConfirmed: 9,
      unread: 9,
      icon: AlertTriangle,
      color: "text-amber-600",
      description: "Scheduling conflicts and errors that need attention",
      priority: "medium"
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
    if (isInBranchContext && id && branchName) {
      // If we're in branch context, navigate to the branch-specific notification page
      navigate(`/branch-dashboard/${id}/${branchName}/notifications/${categoryId}`);
    } else {
      // If we're on the main notifications page
      navigate(`/notifications/${categoryId}`);
    }
  };
  
  // Effect to handle selected category if present in URL
  useEffect(() => {
    if (categoryId) {
      console.log("Selected category:", categoryId);
      // Add any logic needed for the selected category
    }
  }, [categoryId]);

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {isInBranchContext && <BranchSidebar branchName={branchName || "Branch"} />}
      <div className="flex-1">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-6">
          <TabNavigation activeTab={tab} onChange={(value) => setTab(value)} />
          
          <div className="mt-8">
            <div className="mb-6 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="h-6 w-6 text-blue-600" />
                    Notifications
                    {categoryId && (
                      <Badge variant="outline" className="ml-2">
                        {notificationCategories.find(c => c.id === categoryId)?.title || categoryId}
                      </Badge>
                    )}
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Manage all notifications in one place
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {filter === "all" ? "All" : 
                          filter === "unread" ? "Unread" : 
                          filter === "notConfirmed" ? "Not Confirmed" : filter}
                        </span>
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
                  
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead}>
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Mark All Read</span>
                  </Button>
                  
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <Tabs defaultValue={view} onValueChange={setView} className="w-full">
                <div className="flex items-center justify-between">
                  <TabsList className="grid w-[180px] grid-cols-2">
                    <TabsTrigger value="grid">Grid</TabsTrigger>
                    <TabsTrigger value="list">List</TabsTrigger>
                  </TabsList>
                  
                  <div className="text-sm text-gray-500">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
                
                <TabsContent value="grid" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notificationCategories.map((category) => (
                      <Card 
                        key={category.id}
                        className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleCategoryClick(category.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className={`p-2 rounded-full ${category.color} bg-opacity-10`}>
                              <category.icon className={`h-5 w-5 ${category.color}`} />
                            </div>
                            <Badge className={`${getPriorityColor(category.priority)}`}>
                              {category.priority}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl mt-2">{category.title}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-3xl font-bold">{category.count}</div>
                              <div className="text-sm text-gray-500">Total</div>
                            </div>
                            <div className="flex gap-4">
                              <div>
                                <div className="text-lg font-semibold text-amber-600">{category.notConfirmed}</div>
                                <div className="text-xs text-gray-500">Pending</div>
                              </div>
                              <div>
                                <div className="text-lg font-semibold text-blue-600">{category.unread}</div>
                                <div className="text-xs text-gray-500">Unread</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-2 border-t">
                          <Button variant="ghost" size="sm" className="ml-auto" onClick={(e) => {
                            e.stopPropagation();
                            toast({
                              title: `Viewing ${category.title} details`,
                              duration: 2000,
                            });
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View details
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="list" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Summary</CardTitle>
                      <CardDescription>View all notification categories</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {notificationCategories.map((category) => (
                          <div 
                            key={category.id}
                            className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                            onClick={() => handleCategoryClick(category.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${category.color} bg-opacity-10`}>
                                <category.icon className={`h-5 w-5 ${category.color}`} />
                              </div>
                              <div>
                                <div className="font-medium">{category.title}</div>
                                <div className="text-sm text-gray-500">{category.description}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="flex gap-1 items-center">
                                <AlertCircle className="h-3 w-3" />
                                {category.notConfirmed}
                              </Badge>
                              <div className="text-xl font-bold">{category.count}</div>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
