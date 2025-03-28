
import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Bell, Search, Filter, Download, Calendar, Clock, User, FileText } from "lucide-react";
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
import { ModuleNavigation } from "@/components/ModuleNavigation";

const EventsLogs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, branchName } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [activeModule, setActiveModule] = useState("events-logs");
  
  const isInBranchContext = location.pathname.includes("branch-dashboard");
  
  const handleModuleChange = (value: string) => {
    setActiveModule(value);
    
    if (isInBranchContext && id && branchName) {
      if (value === "dashboard") {
        navigate(`/branch-dashboard/${id}/${branchName}`);
      } else {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      }
    } else {
      navigate(`/${value}`);
    }
  };

  // Sample data for events and logs
  const eventsData = [
    { id: 1, title: "Patient Check-in", type: "system", date: "Today, 9:30 AM", user: "Sarah Johnson", priority: "normal" },
    { id: 2, title: "Medication Administration", type: "medication", date: "Today, 10:15 AM", user: "David Miller", priority: "high" },
    { id: 3, title: "Shift Change", type: "staff", date: "Today, 2:00 PM", user: "System", priority: "normal" },
    { id: 4, title: "Emergency Alert", type: "alert", date: "Yesterday, 4:22 PM", user: "Emily Chen", priority: "critical" },
    { id: 5, title: "New Document Uploaded", type: "document", date: "Yesterday, 5:45 PM", user: "Robert Wilson", priority: "low" },
    { id: 6, title: "Patient Discharge", type: "system", date: "Jun 12, 2023", user: "Maria Garcia", priority: "normal" },
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="container px-4 pt-6 pb-20 md:py-8 mx-auto">
        {/* Module Navigation */}
        <div className="mb-6">
          <ModuleNavigation 
            activeModule={activeModule} 
            onModuleChange={handleModuleChange} 
          />
        </div>
        
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Events & Logs</h1>
          <p className="text-gray-500 mt-2 font-medium">Track and monitor all system activities and events</p>
        </div>
        
        <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events and logs..."
                className="pl-10 pr-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="alert">Alerts</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
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
        
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="medication">Medication</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {eventsData.map((event) => (
              <Card key={event.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                        ${event.type === 'alert' ? 'bg-red-100' : 
                          event.type === 'medication' ? 'bg-green-100' : 
                          event.type === 'staff' ? 'bg-blue-100' : 
                          event.type === 'document' ? 'bg-amber-100' : 'bg-purple-100'}`}>
                        {event.type === 'alert' && <Bell className="h-5 w-5 text-red-600" />}
                        {event.type === 'medication' && <FileText className="h-5 w-5 text-green-600" />}
                        {event.type === 'staff' && <User className="h-5 w-5 text-blue-600" />}
                        {event.type === 'document' && <FileText className="h-5 w-5 text-amber-600" />}
                        {event.type === 'system' && <Bell className="h-5 w-5 text-purple-600" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{event.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span>{event.user}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium
                        ${event.priority === 'critical' ? 'bg-red-100 text-red-700' : 
                        event.priority === 'high' ? 'bg-orange-100 text-orange-700' : 
                        event.priority === 'normal' ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-700'}`}>
                        {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="system">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-500">System events will be displayed here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="alerts">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-500">Alert events will be displayed here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="staff">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-500">Staff events will be displayed here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="medication">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-500">Medication events will be displayed here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default EventsLogs;
