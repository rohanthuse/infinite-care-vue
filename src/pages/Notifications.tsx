import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  Bell, Users, User, Calendar, Pill, FileText, 
  AlertTriangle, CheckCircle, RefreshCw, Filter,
  ChevronDown, Eye, Clock, AlertCircle, Home,
  MapPin, Phone, Mail, Plus
} from "lucide-react";
import { TabNavigation } from "@/components/TabNavigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
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
import NotificationsOverview from "@/components/workflow/NotificationsOverview";
import NotificationCategory from "@/components/notifications/NotificationCategory";
import { useBranchInfo } from "@/hooks/useBranchInfo";
import { useNotificationCategoryCounts } from "@/hooks/useNotificationCategoryCounts";
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
  const { data: branchInfo } = useBranchInfo(id);
  const { categoryCounts, isLoading: countsLoading } = useNotificationCategoryCounts(id);
  
  const isInBranchContext = location.pathname.includes('/branch-dashboard/');
  
  // Use dynamic counts from the hook
  const notificationCategories: NotificationCategory[] = [
    {
      id: "staff",
      title: "Staff Notifications",
      count: countsLoading ? 0 : categoryCounts.staff.total,
      notConfirmed: 0, // We don't have "confirmed" status in our data model
      unread: countsLoading ? 0 : categoryCounts.staff.unread,
      icon: Users,
      color: "text-blue-600",
      description: "Updates related to staff scheduling, training, and performance",
      priority: "medium"
    },
    {
      id: "client",
      title: "Client Notifications",
      count: countsLoading ? 0 : categoryCounts.client.total,
      notConfirmed: 0,
      unread: countsLoading ? 0 : categoryCounts.client.unread,
      icon: User,
      color: "text-green-600",
      description: "Updates on client appointments, requests, and feedback",
      priority: "high"
    },
    {
      id: "rota",
      title: "Rota Updates",
      count: countsLoading ? 0 : categoryCounts.rota.total,
      notConfirmed: 0,
      unread: countsLoading ? 0 : categoryCounts.rota.unread,
      icon: Calendar,
      color: "text-indigo-600",
      description: "Changes to staff schedules and shift assignments",
      priority: "high"
    },
    {
      id: "medication",
      title: "Medication Alerts",
      count: countsLoading ? 0 : categoryCounts.medication.total,
      notConfirmed: 0,
      unread: countsLoading ? 0 : categoryCounts.medication.unread,
      icon: Pill,
      color: "text-rose-600",
      description: "Medication schedules, updates, and stock alerts",
      priority: "high"
    },
    {
      id: "document",
      title: "Document Updates",
      count: countsLoading ? 0 : categoryCounts.document.total,
      notConfirmed: 0,
      unread: countsLoading ? 0 : categoryCounts.document.unread,
      icon: FileText,
      color: "text-gray-600",
      description: "Recently modified documents and expiry alerts",
      priority: "low"
    },
    {
      id: "system",
      title: "System Alerts",
      count: countsLoading ? 0 : categoryCounts.system.total,
      notConfirmed: 0,
      unread: countsLoading ? 0 : categoryCounts.system.unread,
      icon: AlertTriangle,
      color: "text-amber-600",
      description: "System notifications and critical alerts",
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
      navigate(`/branch-dashboard/${id}/${branchName}/notifications/${categoryId}`);
    } else {
      // Extract tenant slug from current path for tenant-aware navigation
      const pathParts = location.pathname.split('/').filter(Boolean);
      const tenantSlug = pathParts[0] && !['super-admin', 'carer-login', 'client-login', 'carer-invitation', 'carer-onboarding', 'tenant-setup', 'tenant-error', 'system-login', 'system-dashboard', 'services', 'settings', 'dashboard', 'agreement', 'hobbies', 'skills', 'medical-mental', 'type-of-work', 'body-map-points', 'branch', 'branch-admins', 'notifications'].includes(pathParts[0]) ? pathParts[0] : null;
      
      if (tenantSlug) {
        navigate(`/${tenantSlug}/notifications/${categoryId}`);
      } else {
        navigate(`/notifications/${categoryId}`);
      }
    }
  };
  
  useEffect(() => {
    if (categoryId) {
      console.log("Selected category:", categoryId);
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
  
  const handleNavigationChange = (value: string) => {
    if (value === "notifications") {
      setTab(value);
    } else {
      if (isInBranchContext && id && branchName) {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      } else {
        navigate(`/${value}`);
      }
    }
  };

  useEffect(() => {
    setTab("notifications");
  }, []);

  const handleNewBooking = () => {
    if (isInBranchContext && id && branchName) {
      navigate(`/branch-dashboard/${id}/${branchName}/bookings/new`);
    } else {
      navigate('/bookings/new');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <DashboardHeader />
      {!isInBranchContext && <DashboardNavbar />}
      <div className="container mx-auto px-4 py-6">
        {isInBranchContext && (
          <>
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <Home className="h-4 w-4 mr-1" />
              <span className="mr-2">
                <button 
                  onClick={() => navigate('/branches')}
                  className="hover:text-blue-600 hover:underline"
                >
                  Branches
                </button>
              </span>
              <span className="mx-2">&gt;</span>
              <span className="font-medium text-gray-700">{branchName}</span>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <h1 className="text-4xl font-bold text-gray-900">{branchName}</h1>
                  <Badge className="ml-3 bg-green-100 text-green-800 hover:bg-green-200">
                    Active
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-4 text-gray-600">
                  {branchInfo?.address && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{branchInfo.address}</span>
                    </div>
                  )}
                  {branchInfo?.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{branchInfo.phone}</span>
                    </div>
                  )}
                  {branchInfo?.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{branchInfo.email}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700"
                onClick={handleNewBooking}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </div>
          </>
        )}
        
        <TabNavigation activeTab={tab} onChange={handleNavigationChange} hideQuickAdd={true} />
        
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
          
          {categoryId ? (
            <NotificationCategory 
              categoryId={categoryId} 
              branchId={id} 
              branchName={branchName} 
            />
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-4">Notification Overview</h2>
                <NotificationsOverview branchId={id} branchName={branchName} />
              </div>
              
              <div className="mb-6 mt-8">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
