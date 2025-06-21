
import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TabNavigation } from "@/components/TabNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, AlertTriangle, Calendar, FileWarning, CheckCircle } from "lucide-react";

const Notifications = () => {
  const { id, branchName, categoryId } = useParams();
  const navigate = useNavigate();
  const [activeNavTab, setActiveNavTab] = useState("notifications");
  const [activeTab, setActiveTab] = useState(categoryId || "all");
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  useEffect(() => {
    document.title = `Notifications | ${decodedBranchName}`;
  }, [decodedBranchName]);

  useEffect(() => {
    if (categoryId) {
      setActiveTab(categoryId);
    }
  }, [categoryId]);
  
  const handleNavTabChange = (value: string) => {
    setActiveNavTab(value);
    
    if (value !== "notifications") {
      if (id && branchName) {
        navigate(`/admin/branch-dashboard/${id}/${encodeURIComponent(decodedBranchName)}/${value}`);
      } else {
        navigate(`/admin/${value}`);
      }
    }
  };
  
  const handleNewBooking = () => {
    toast.info("New booking functionality will be implemented soon");
  };

  const notificationCategories = [
    { id: "all", label: "All Notifications", icon: Bell, count: 15 },
    { id: "staff", label: "Staff Notifications", icon: Bell, count: 5 },
    { id: "system", label: "System Alerts", icon: AlertTriangle, count: 3 },
    { id: "client", label: "Client Notifications", icon: Bell, count: 4 },
    { id: "medication", label: "Medication Alerts", icon: Clock, count: 2 },
    { id: "rota", label: "Rota Errors", icon: Calendar, count: 1 },
    { id: "documents", label: "Document Updates", icon: FileWarning, count: 0 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-8 md:py-6 w-full max-w-[1600px] mx-auto">
        <BranchInfoHeader 
          branchName={decodedBranchName} 
          branchId={id || ""}
          onNewBooking={handleNewBooking}
        />
        
        <div className="mt-6">
          <TabNavigation 
            activeTab={activeNavTab} 
            onChange={handleNavTabChange} 
            hideActionsOnMobile={true}
          />
        </div>
        
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold">Notifications Center</h2>
            <p className="text-gray-500 mt-1">Monitor and manage all system notifications</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-100 p-4">
              <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full">
                {notificationCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      className="flex items-center gap-2 relative"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden md:inline">{category.label}</span>
                      <span className="md:hidden">{category.label.split(' ')[0]}</span>
                      {category.count > 0 && (
                        <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {category.count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            
            {notificationCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="p-6">
                <div className="space-y-4">
                  {category.count > 0 ? (
                    <div className="text-center py-8">
                      <category.icon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {category.label}
                      </h3>
                      <p className="text-gray-500">
                        {category.count} notification{category.count !== 1 ? 's' : ''} in this category
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Notification details will be implemented soon
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        All clear!
                      </h3>
                      <p className="text-gray-500">
                        No notifications in this category
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
