
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Routes, Route, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { motion } from "framer-motion";
import { 
  Calendar, Users, BarChart4, Clock, FileText, AlertCircle, Search, Bell, ChevronRight, Home, ArrowUpRight, Phone, Mail, MapPin, Plus, Clock7, RefreshCw, Download, Filter, ClipboardCheck, ThumbsUp, ArrowUp, ArrowDown, ChevronDown, Edit, Eye, HelpCircle, CalendarIcon, ChevronLeft
} from "lucide-react";
import { BranchAgreementsTab } from "@/components/agreements/BranchAgreementsTab";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabNavigation } from "@/components/TabNavigation";
import { BookingsTab } from "@/components/bookings/BookingsTab";
import { CarersTab } from "@/components/carers/CarersTab";
import ReviewsTab from "@/components/reviews/ReviewsTab";
import { AddClientDialog } from "@/components/AddClientDialog";
import { NewBookingDialog } from "@/components/bookings/NewBookingDialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { CommunicationsTab } from "@/components/communications/CommunicationsTab";
import { ListChecks, BookText } from "lucide-react";
import KeyParametersContent from "@/components/keyparameters/KeyParametersContent";
import WorkflowContent from "@/components/workflow/WorkflowContent";
import { MedicationTab } from "@/components/medication/MedicationTab";
import { CareTab } from "@/components/care/CareTab";
import NotificationsOverview from "@/components/workflow/NotificationsOverview";
import TaskMatrix from "./TaskMatrix";
import TrainingMatrix from "./TrainingMatrix";
import AccountingTab from "@/components/accounting/AccountingTab";
import { AttendanceTab } from "@/components/attendance/AttendanceTab";

export default function BranchDashboard() {
  const { id = "", branchName = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  // State
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadedDataKey, setLoadedDataKey] = useState("default");

  useEffect(() => {
    // Extract the active tab from the URL path
    const pathSegments = path.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Only set the active tab if it's present in the URL
    if (lastSegment !== id && lastSegment !== branchName) {
      setActiveTab(lastSegment);
    } else {
      // Default to dashboard if no specific tab is in the URL
      setActiveTab("dashboard");
    }
  }, [path, id, branchName]);

  useEffect(() => {
    // Update data key when tab changes to force component refresh
    setLoadedDataKey(`${activeTab}-${Date.now()}`);
  }, [activeTab]);

  const handleTabClick = (tabKey: string) => {
    setActiveTab(tabKey);
    navigate(`/branch-dashboard/${id}/${branchName}/${tabKey}`);
  };

  const getTabIcon = (tabKey: string) => {
    const icons: Record<string, React.ReactNode> = {
      dashboard: <Home className="w-5 h-5" />,
      carers: <Users className="w-5 h-5" />,
      agreements: <FileText className="w-5 h-5" />,
      bookings: <Calendar className="w-5 h-5" />,
      communications: <Mail className="w-5 h-5" />,
      reviews: <ThumbsUp className="w-5 h-5" />,
      medication: <BookText className="w-5 h-5" />,
      care: <Heart className="w-5 h-5" />,
      workflow: <ListChecks className="w-5 h-5" />,
      "key-parameters": <BarChart4 className="w-5 h-5" />,
      accounting: <Calculator className="w-5 h-5" />,
      attendance: <ClipboardCheck className="w-5 h-5" />,
    };
    return icons[tabKey] || <ChevronRight className="w-5 h-5" />;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div>
            {/* Branch Dashboard Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Latest Bookings</CardTitle>
                  <CardDescription>Recent and upcoming bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 rounded bg-gray-50">
                      <div>
                        <p className="font-medium">Home Visit: John Smith</p>
                        <p className="text-sm text-gray-500">Today, 15:00 - 16:00</p>
                      </div>
                      <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-gray-50">
                      <div>
                        <p className="font-medium">Therapy Session: Jane Doe</p>
                        <p className="text-sm text-gray-500">Tomorrow, 10:00 - 11:30</p>
                      </div>
                      <Badge className="bg-blue-500 hover:bg-blue-600">Scheduled</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-gray-50">
                      <div>
                        <p className="font-medium">Follow-up: Robert Johnson</p>
                        <p className="text-sm text-gray-500">23 Apr, 13:00 - 13:30</p>
                      </div>
                      <Badge className="bg-blue-500 hover:bg-blue-600">Scheduled</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full text-primary" onClick={() => handleTabClick("bookings")}>
                    View All Bookings
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Staff Overview</CardTitle>
                  <CardDescription>Staff availability and status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <p>Available</p>
                      </div>
                      <p className="font-semibold">5</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                        <p>On Duty</p>
                      </div>
                      <p className="font-semibold">8</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                        <p>On Leave</p>
                      </div>
                      <p className="font-semibold">3</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                        <p>Off Duty</p>
                      </div>
                      <p className="font-semibold">6</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Available', value: 5, color: '#10b981' },
                            { name: 'On Duty', value: 8, color: '#f97316' },
                            { name: 'On Leave', value: 3, color: '#ef4444' },
                            { name: 'Off Duty', value: 6, color: '#9ca3af' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {[
                            { name: 'Available', value: 5, color: '#10b981' },
                            { name: 'On Duty', value: 8, color: '#f97316' },
                            { name: 'On Leave', value: 3, color: '#ef4444' },
                            { name: 'Off Duty', value: 6, color: '#9ca3af' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full text-primary" onClick={() => handleTabClick("carers")}>
                    Manage Staff
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Upcoming Tasks</CardTitle>
                  <CardDescription>Tasks and deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start p-2 rounded bg-gray-50">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          <ClipboardCheck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Insurance Renewal</p>
                          <p className="text-sm text-gray-500">Due in 3 days</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-amber-500 text-amber-500">High</Badge>
                    </div>
                    <div className="flex justify-between items-start p-2 rounded bg-gray-50">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          <ClipboardCheck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Staff Meeting</p>
                          <p className="text-sm text-gray-500">Tomorrow, 09:00</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-blue-500 text-blue-500">Medium</Badge>
                    </div>
                    <div className="flex justify-between items-start p-2 rounded bg-gray-50">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          <ClipboardCheck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Quarterly Report</p>
                          <p className="text-sm text-gray-500">Due in 1 week</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-green-500 text-green-500">Low</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full text-primary" onClick={() => handleTabClick("workflow")}>
                    View All Tasks
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Recent Activities</CardTitle>
                  <CardDescription>Latest actions and events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="relative mt-1">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="absolute top-8 bottom-0 left-1/2 w-px -translate-x-1/2 bg-gray-200"></div>
                      </div>
                      <div>
                        <p className="text-sm"><span className="font-semibold">Sarah Johnson</span> added a new client</p>
                        <p className="text-xs text-gray-500">Today, 10:23 AM</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="relative mt-1">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="absolute top-8 bottom-0 left-1/2 w-px -translate-x-1/2 bg-gray-200"></div>
                      </div>
                      <div>
                        <p className="text-sm"><span className="font-semibold">David Williams</span> scheduled 3 new appointments</p>
                        <p className="text-xs text-gray-500">Yesterday, 4:45 PM</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="relative mt-1">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="absolute top-8 bottom-0 left-1/2 w-px -translate-x-1/2 bg-gray-200"></div>
                      </div>
                      <div>
                        <p className="text-sm"><span className="font-semibold">System</span> generated monthly report</p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm"><span className="font-semibold">Admin</span> updated policy documents</p>
                        <p className="text-xs text-gray-500">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full text-primary">
                    View All Activities
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Performance Metrics</CardTitle>
                  <CardDescription>Monthly statistics overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Week 1', appointments: 35, revenue: 4200 },
                          { name: 'Week 2', appointments: 28, revenue: 3800 },
                          { name: 'Week 3', appointments: 42, revenue: 5100 },
                          { name: 'Week 4', appointments: 38, revenue: 4600 }
                        ]}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="appointments" name="Appointments" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="revenue" name="Revenue (£)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-500">Total Clients</div>
                      <div className="text-2xl font-semibold">247</div>
                      <div className="flex items-center text-xs text-green-600 mt-1">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        <span>12% from last month</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-500">Client Satisfaction</div>
                      <div className="text-2xl font-semibold">4.8/5</div>
                      <div className="flex items-center text-xs text-green-600 mt-1">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        <span>0.3 from last month</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full text-primary" onClick={() => handleTabClick("key-parameters")}>
                    View Full Analytics
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2 flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-lg font-medium">Recent Clients</CardTitle>
                    <CardDescription>Latest client registrations</CardDescription>
                  </div>
                  <Button className="h-8" onClick={() => setIsAddingClient(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Client
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Michael Thompson</TableCell>
                        <TableCell>April 12, 2025</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Elizabeth Wilson</TableCell>
                        <TableCell>April 10, 2025</TableCell>
                        <TableCell>
                          <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Robert Garcia</TableCell>
                        <TableCell>April 8, 2025</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Patricia Martinez</TableCell>
                        <TableCell>April 5, 2025</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Jennifer Brown</TableCell>
                        <TableCell>April 3, 2025</TableCell>
                        <TableCell>
                          <Badge className="bg-gray-500 hover:bg-gray-600">Inactive</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter>
                  <div className="flex w-full justify-center">
                    <Button variant="outline" className="text-primary">
                      View All Clients
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
            
            <NotificationsOverview />
          </div>
        );
      case "agreements":
        return <BranchAgreementsTab branchId={id} branchName={branchName} key={loadedDataKey} />;
      case "bookings":
        return <BookingsTab branchId={id} branchName={branchName} key={loadedDataKey} />;
      case "carers":
        return <CarersTab branchId={id} branchName={branchName} key={loadedDataKey} />;
      case "communications":
        return <CommunicationsTab branchId={id} branchName={branchName} key={loadedDataKey} />;
      case "reviews":
        return <ReviewsTab branchId={id} branchName={branchName} key={loadedDataKey} />;
      case "medication":
        return <MedicationTab branchId={id} branchName={branchName} key={loadedDataKey} />;
      case "care":
        return <CareTab branchId={id} branchName={branchName} key={loadedDataKey} />;
      case "workflow":
        return <WorkflowContent branchId={id} branchName={branchName} key={loadedDataKey} />;
      case "key-parameters":
        return <KeyParametersContent branchId={id} branchName={branchName} key={loadedDataKey} />;
      case "accounting":
        return <AccountingTab branchId={id} branchName={branchName} key={loadedDataKey} />;
      case "attendance":
        return <AttendanceTab branchId={id} branchName={branchName} key={loadedDataKey} />;
      default:
        return (
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tab Not Implemented</h3>
            <p className="text-gray-500">This tab is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
      />
      
      {/* Branch Info Header */}
      <BranchInfoHeader
        branchId={id}
        branchName={branchName}
      />
      
      {/* Tab Navigation */}
      <div className="container mx-auto px-4 lg:px-8 mt-4">
        <TabNavigation 
          tabs={[
            { key: "dashboard", label: "Dashboard", icon: <Home className="h-4 w-4 mr-2" /> },
            { key: "carers", label: "Staff", icon: <Users className="h-4 w-4 mr-2" /> },
            { key: "bookings", label: "Appointments", icon: <Calendar className="h-4 w-4 mr-2" /> },
            { key: "agreements", label: "Agreements", icon: <FileText className="h-4 w-4 mr-2" /> },
            { key: "communications", label: "Communications", icon: <Mail className="h-4 w-4 mr-2" /> },
            { key: "reviews", label: "Reviews", icon: <ThumbsUp className="h-4 w-4 mr-2" /> },
            { key: "medication", label: "Medication", icon: <BookText className="h-4 w-4 mr-2" /> },
            { key: "care", label: "Care", icon: <Heart className="h-4 w-4 mr-2" /> },
            { key: "workflow", label: "Workflow", icon: <ListChecks className="h-4 w-4 mr-2" /> },
            { key: "key-parameters", label: "Analytics", icon: <BarChart4 className="h-4 w-4 mr-2" /> },
            { key: "accounting", label: "Accounting", icon: <Calculator className="h-4 w-4 mr-2" /> },
            { key: "attendance", label: "Attendance", icon: <ClipboardCheck className="h-4 w-4 mr-2" /> },
          ]}
          activeTab={activeTab}
          onTabClick={handleTabClick}
        />
      </div>
      
      {/* Main Content */}
      <motion.div 
        className="container mx-auto px-4 lg:px-8 py-6"
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderTabContent()}
      </motion.div>
      
      {/* Add Client Dialog */}
      <AddClientDialog 
        open={isAddingClient} 
        onOpenChange={setIsAddingClient} 
      />
      
      {/* New Booking Dialog */}
      <NewBookingDialog
        open={isBookingDialogOpen}
        onOpenChange={setIsBookingDialogOpen}
      />
    </div>
  );
}

// Missing Heart and Calculator components import
import { Heart, Calculator, User } from "lucide-react";
