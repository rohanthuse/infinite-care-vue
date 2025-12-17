import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ListChecks, FileText, ClipboardCheck, Search, Filter, Download, Users } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotificationsOverview from "@/components/workflow/NotificationsOverview";
import AuthoritiesTab from "@/components/workflow/AuthoritiesTab";
import { toast } from "@/hooks/use-toast";

const Workflow = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  
  const handleTaskMatrixClick = () => {
    navigate('/task-matrix');
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 container px-4 pt-6 pb-20 md:py-8 mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Workflow Management</h1>
          <p className="text-gray-500 mt-2 font-medium">Manage and monitor all workflow processes</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authorities">Authorities</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search workflows..."
                    className="pl-10 pr-4"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="hidden md:inline">More Filters</span>
                  </Button>
                  
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    <span className="hidden md:inline">Export</span>
                  </Button>
                </div>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <NotificationsOverview />
              
              <div className="mb-8 mt-8">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-4">Core Workflow Elements</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <Card 
                    className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                    onClick={() => navigate('/notifications')}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                        <Bell className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-lg">Notification Overview</h3>
                      <p className="text-sm text-gray-500 mt-1">System alerts and updates</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                    onClick={handleTaskMatrixClick}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                        <ListChecks className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-lg">Action Plan</h3>
                      <p className="text-sm text-gray-500 mt-1">Manage priority tasks</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                    onClick={() => navigate('/forms')}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                        <FileText className="h-8 w-8 text-amber-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-lg">Form Matrix</h3>
                      <p className="text-sm text-gray-500 mt-1">Document templates</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-4">Additional Workflows</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <Card 
                    className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                    onClick={() => navigate('/key-parameters')}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                        <ListChecks className="h-8 w-8 text-indigo-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-lg">Core Settings</h3>
                      <p className="text-sm text-gray-500 mt-1">Track metrics</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                    onClick={() => navigate('/medication')}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3">
                        <ClipboardCheck className="h-8 w-8 text-red-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-lg">Medication</h3>
                      <p className="text-sm text-gray-500 mt-1">Medicine tracking</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                    onClick={() => navigate('/care-plan')}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center mb-3">
                        <ClipboardCheck className="h-8 w-8 text-cyan-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-lg">Care Plan</h3>
                      <p className="text-sm text-gray-500 mt-1">Patient care plans</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                    onClick={() => navigate('/staff-forms')}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                        <Users className="h-8 w-8 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-lg">Staff Forms</h3>
                      <p className="text-sm text-gray-500 mt-1">Manage staff submissions</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="authorities">
            <AuthoritiesTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Workflow;
