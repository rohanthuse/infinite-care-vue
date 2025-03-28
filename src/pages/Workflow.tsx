
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ListChecks, BookText, FileText, ClipboardCheck, Search, Filter, Download } from "lucide-react";
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
import { ModuleContent } from "@/components/TabNavigation";

const Workflow = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 container px-4 pt-6 pb-20 md:py-8 mx-auto">
        <ModuleContent 
          title="Workflow Management" 
          description="Manage and monitor all workflow processes"
        >
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
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-4">Core Workflow Elements</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                  onClick={() => navigate('/tasks')}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                      <ListChecks className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-lg">Task Matrix</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage priority tasks</p>
                  </CardContent>
                </Card>

                <Card 
                  className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                  onClick={() => navigate('/training')}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                      <BookText className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-lg">Training Matrix</h3>
                    <p className="text-sm text-gray-500 mt-1">Staff development</p>
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
                  onClick={() => navigate('/parameters')}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                      <ListChecks className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-lg">Key Parameters</h3>
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
              </div>
            </div>
          </motion.div>
        </ModuleContent>
      </main>
    </div>
  );
};

export default Workflow;
