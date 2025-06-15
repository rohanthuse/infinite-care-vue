import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Routes, Route, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { motion } from "framer-motion";
import { 
  Calendar, Users, BarChart4, Clock, FileText, AlertCircle, Search, Bell, ChevronRight, Home, ArrowUpRight, Phone, Mail, MapPin, Plus, Clock7, RefreshCw, Download, Filter, ClipboardCheck, ThumbsUp, ArrowUp, ArrowDown, ChevronDown, Edit, Eye, HelpCircle, CalendarIcon, ChevronLeft, FilePlus, AlertTriangle
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
import { format, formatDistanceToNow } from "date-fns";
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
import { FormBuilderTab } from "@/components/form-builder/FormBuilderTab";
import { ClientDetail } from "@/components/clients/ClientDetail";
import { useBranchDashboardStats } from "@/data/hooks/useBranchDashboardStats";
import { useBranchStatistics } from "@/data/hooks/useBranchStatistics";
import { useBranchClients } from "@/data/hooks/useBranchClients";
import { useBranchChartData } from "@/data/hooks/useBranchChartData";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DashboardStat } from "@/components/dashboard/DashboardStat";
import { BookingItem } from "@/components/dashboard/BookingItem";
import { ReviewItem, ReviewItemSkeleton } from "@/components/dashboard/ReviewItem";
import { ActionItem } from "@/components/dashboard/ActionItem";

interface BranchDashboardProps {
  tab?: string;
}

const COLORS = ["#4f46e5", "#a5b4fc"];

const BranchDashboard: React.FC<BranchDashboardProps> = ({ tab: initialTab }) => {
  const {
    id,
    branchName,
    "*": restPath
  } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const { data: dashboardStats, isLoading: isLoadingDashboardStats } = useBranchDashboardStats(id);
  const { data: branchStats, isLoading: isLoadingBranchStats, error: branchStatsError } = useBranchStatistics(id);
  const { data: chartData, isLoading: isLoadingChartData } = useBranchChartData(id);

  const getTabFromPath = (path?: string): string => {
    if (!path || path.startsWith("dashboard")) return "dashboard";
    if (path.startsWith("key-parameters")) return "key-parameters";
    if (path.startsWith("workflow")) return "workflow";
    if (path.startsWith("task-matrix")) return "task-matrix";
    if (path.startsWith("training-matrix")) return "training-matrix";
    if (path.startsWith("bookings")) return "bookings";
    if (path.startsWith("carers")) return "carers";
    if (path.startsWith("clients")) return "clients";
    if (path.startsWith("communications")) return "communications";
    if (path.startsWith("medication")) return "medication";
    if (path.startsWith("accounting")) return "accounting";
    if (path.startsWith("reviews")) return "reviews";
    if (path.startsWith("care")) return "care";
    if (path.startsWith("agreements")) return "agreements";
    if (path.startsWith("form-builder")) return "forms";
    return "dashboard";
  };
  
  const [activeTab, setActiveTab] = useState(() => {
    const initialTab = getTabFromPath(restPath);
    console.log(`[BranchDashboard] Initializing. restPath: '${restPath}', initial tab: '${initialTab}'`);
    return initialTab;
  });
  
  useEffect(() => {
    let path = "";
    const parts = location.pathname.split('/');
    if (parts.length > 4) {
      path = parts.slice(4).join('/');
    }
    const newTab = getTabFromPath(path);
    console.log(`[BranchDashboard] Pathname changed: ${location.pathname}, parsed path: '${path}', new tab: '${newTab}'`);
    setActiveTab(newTab);
  }, [location.pathname]);

  const [searchValue, setSearchValue] = useState("");
  const [clientSearchValue, setClientSearchValue] = useState("");
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedClientSearch(clientSearchValue);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [clientSearchValue]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientDetailOpen, setClientDetailOpen] = useState<boolean>(false);
  const itemsPerPage = 5;

  const { data: clientsData, isLoading: isLoadingClients, error: clientsError } = useBranchClients({
    branchId: id,
    searchTerm: debouncedClientSearch,
    statusFilter,
    regionFilter,
    page: currentPage,
    itemsPerPage,
  });

  const clients = clientsData?.clients || [];
  const totalClients = clientsData?.count || 0;
  const totalPages = Math.ceil(totalClients / itemsPerPage);

  const displayBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");
  
  useEffect(() => {
    if(currentPage > 1 && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage === 0 && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedClientSearch, statusFilter, regionFilter]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleNewBooking = () => {
    setNewBookingDialogOpen(true);
  };

  const handleNewClient = () => {
    setAddClientDialogOpen(true);
  };

  const handleClientAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['branch-clients'] });
    queryClient.invalidateQueries({ queryKey: ['branch-statistics', id] });
    queryClient.invalidateQueries({ queryKey: ['branch-dashboard-stats', id] });
    queryClient.invalidateQueries({ queryKey: ['branch-chart-data', id] });
  };

  const mockClients = [{
    id: "CL-001",
    name: "Pender, Eva",
    initials: "EP",
    bookingCount: 3
  }, {
    id: "CL-002",
    name: "Fulcher, Patricia",
    initials: "FP",
    bookingCount: 2
  }, {
    id: "CL-003",
    name: "Baulch, Ursula",
    initials: "BU",
    bookingCount: 1
  }, {
    id: "CL-004",
    name: "Ren, Victoria",
    initials: "RV",
    bookingCount: 2
  }, {
    id: "CL-005",
    name: "Iyaniwura, Ifeoluwa",
    initials: "II",
    bookingCount: 1
  }, {
    id: "CL-006",
    name: "Careville Ltd",
    initials: "CL",
    bookingCount: 4
  }, {
    id: "CL-007",
    name: "Johnson, Andrew",
    initials: "JA",
    bookingCount: 2
  }, {
    id: "CL-008",
    name: "Mistry, Sanjay",
    initials: "MS",
    bookingCount: 3
  }];

  const mockCarers = [{
    id: "CA-001",
    name: "Charuma, Charmaine",
    initials: "CC",
    bookingCount: 4
  }, {
    id: "CA-002",
    name: "Warren, Susan",
    initials: "WS",
    bookingCount: 3
  }, {
    id: "CA-003",
    name: "Ayo-Famure, Opeyemi",
    initials: "AF",
    bookingCount: 3
  }, {
    id: "CA-004",
    name: "Smith, John",
    initials: "SJ",
    bookingCount: 2
  }, {
    id: "CA-005",
    name: "Williams, Mary",
    initials: "WM",
    bookingCount: 1
  }];

  const handleCreateBooking = (bookingData: any) => {
    console.log("Creating new booking:", bookingData);
    setNewBookingDialogOpen(false);
  };

  const handleWorkflowNavigation = (path: string) => {
    navigate(`/branch-dashboard/${id}/${encodeURIComponent(displayBranchName)}/${path}`);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    if (id && branchName) {
      if (tab === "dashboard") {
        navigate(`/branch-dashboard/${id}/${branchName}`);
      } else if (tab === "key-parameters") {
        navigate(`/branch-dashboard/${id}/${branchName}/key-parameters`);
      } else if (tab === "workflow") {
        navigate(`/branch-dashboard/${id}/${branchName}/workflow`);
      } else if (tab === "task-matrix") {
        navigate(`/branch-dashboard/${id}/${branchName}/task-matrix`);
      } else if (tab === "training-matrix") {
        navigate(`/branch-dashboard/${id}/${branchName}/training-matrix`);
      } else if (tab === "forms") {
        navigate(`/branch-dashboard/${id}/${branchName}/form-builder`);
      } else {
        navigate(`/branch-dashboard/${id}/${branchName}/${tab}`);
      }
    }
  };

  const handleViewClient = (client: any) => {
    const clientForDetails = {
      ...client,
      name: `${client.first_name} ${client.last_name}`,
      location: client.address,
      avatar: client.avatar_initials,
      registeredOn: client.registered_on ? format(new Date(client.registered_on), 'dd/MM/yyyy') : 'N/A'
    };
    setSelectedClient(clientForDetails);
    setClientDetailOpen(true);
  };

  const handleCloseClientDetail = () => {
    setClientDetailOpen(false);
    setSelectedClient(null);
  };

  const handleAddNote = () => {
    console.log("Add note for client:", selectedClient?.id);
    // Implement note adding functionality
  };

  const handleScheduleAppointment = () => {
    console.log("Schedule appointment for client:", selectedClient?.id);
    setNewBookingDialogOpen(true);
  };

  const handleUploadDocument = () => {
    console.log("Upload document for client:", selectedClient?.id);
    // Implement document upload functionality
  };

  const totalClientsForDist = chartData?.clientDistribution.reduce((acc, cur) => acc + cur.value, 0) || 0;
  const returningClientsCount = chartData?.clientDistribution.find(d => d.name === "Returning")?.value || 0;
  const newClientsCount = chartData?.clientDistribution.find(d => d.name === "New")?.value || 0;
  const returningPercentage = totalClientsForDist > 0 ? Math.round((returningClientsCount / totalClientsForDist) * 100) : 0;
  const newPercentage = totalClientsForDist > 0 ? Math.round((newClientsCount / totalClientsForDist) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      {id && (
        <AddClientDialog
          open={addClientDialogOpen}
          onOpenChange={setAddClientDialogOpen}
          branchId={id}
          onSuccess={handleClientAdded}
        />
      )}
      
      <NewBookingDialog open={newBookingDialogOpen} onOpenChange={setNewBookingDialogOpen} clients={mockClients} carers={mockCarers} onCreateBooking={handleCreateBooking} />
      
      {clientDetailOpen && selectedClient && (
        <ClientDetail 
          client={selectedClient}
          onClose={handleCloseClientDetail}
          onAddNote={handleAddNote}
          onScheduleAppointment={handleScheduleAppointment}
          onUploadDocument={handleUploadDocument}
        />
      )}
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-20 md:py-6 w-full">
        <BranchInfoHeader 
          branchName={decodeURIComponent(branchName || "Med-Infinite Branch")} 
          branchId={id || ""}
          onNewBooking={handleNewBooking}
        />
        
        <div className="mb-6">
          <TabNavigation 
            activeTab={activeTab} 
            onChange={handleTabChange}
          />
        </div>
        
        {activeTab === "dashboard" && (
          <motion.div key={activeTab} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.3
          }} className="mt-4 md:mt-6">
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button variant="outline" className="h-auto py-3 px-4 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-left justify-start" onClick={handleNewClient}>
                <div className="mr-2 md:mr-3 h-7 md:h-8 w-7 md:w-8 rounded-md bg-blue-100 flex items-center justify-center">
                  <Plus className="h-3.5 md:h-4 w-3.5 md:w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-xs md:text-sm">New Client</div>
                  <div className="text-xs text-gray-500 hidden md:block">Add client details</div>
                </div>
              </Button>
              
              <Button variant="outline" className="h-auto py-3 px-4 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-left justify-start" onClick={() => handleTabChange("bookings")}>
                <div className="mr-2 md:mr-3 h-7 md:h-8 w-7 md:w-8 rounded-md bg-green-100 flex items-center justify-center">
                  <Calendar className="h-3.5 md:h-4 w-3.5 md:w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-xs md:text-sm">Schedule</div>
                  <div className="text-xs text-gray-500 hidden md:block">View calendar</div>
                </div>
              </Button>
              
              <Button variant="outline" className="h-auto py-3 px-4 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-left justify-start">
                <div className="mr-2 md:mr-3 h-7 md:h-8 w-7 md:w-8 rounded-md bg-amber-100 flex items-center justify-center">
                  <FileText className="h-3.5 md:h-4 w-3.5 md:w-4 text-amber-600" />
                </div>
                <div>
                  <div className="font-medium text-xs md:text-sm">Reports</div>
                  <div className="text-xs text-gray-500 hidden md:block">Generate reports</div>
                </div>
              </Button>
              
              <Button variant="outline" className="h-auto py-3 px-4 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-left justify-start" onClick={() => handleTabChange("carers")}>
                <div className="mr-2 md:mr-3 h-7 md:h-8 w-7 md:w-8 rounded-md bg-purple-100 flex items-center justify-center">
                  <Users className="h-3.5 md:h-4 w-3.5 md:w-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-xs md:text-sm">Carers</div>
                  <div className="text-xs text-gray-500 hidden md:block">Manage carers</div>
                </div>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
              <DashboardStat 
                title="Total Clients" 
                value={dashboardStats?.clientsCount?.toString() ?? "0"} 
                change="+12%" 
                icon={<Users className="h-5 w-5 text-blue-600" />} 
                positive={true} 
                isLoading={isLoadingDashboardStats}
              />
              <DashboardStat 
                title="Today's Bookings" 
                value={dashboardStats?.todaysBookingsCount?.toString() ?? "0"} 
                change="+8%" 
                icon={<Calendar className="h-5 w-5 text-green-600" />} 
                positive={true} 
                isLoading={isLoadingDashboardStats}
              />
              <DashboardStat 
                title="Pending Reviews" 
                value={dashboardStats?.pendingReviewsCount?.toString() ?? "0"} 
                change="-3%" 
                icon={<FileText className="h-5 w-5 text-amber-600" />} 
                positive={false} 
                isLoading={isLoadingDashboardStats}
              />
              <DashboardStat 
                title="Monthly Revenue" 
                value={`£${(dashboardStats?.monthlyRevenue ?? 0).toLocaleString()}`} 
                change="+15.3%" 
                icon={<BarChart4 className="h-5 w-5 text-purple-600" />} 
                positive={true} 
                isLoading={isLoadingDashboardStats}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base md:text-lg font-semibold">Weekly Statistics</CardTitle>
                      <CardDescription>Appointments, visits and revenue</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] md:h-[300px] w-full">
                    {isLoadingChartData ? (
                      <div className="flex items-center justify-center h-full">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData?.weeklyStats} margin={{
                        top: 20,
                        right: 30,
                        left: 0,
                        bottom: 5
                      }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #f0f0f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                        }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="visits" name="Visits" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (£)" stroke="#10b981" strokeWidth={2} dot={{
                          r: 4
                        }} />
                      </BarChart>
                    </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base md:text-lg font-semibold">Client Distribution</CardTitle>
                  <CardDescription>New vs returning clients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px] md:h-[240px] flex items-center justify-center">
                    {isLoadingChartData ? (
                       <div className="flex items-center justify-center h-full">
                        <Skeleton className="h-48 w-48 rounded-full" />
                      </div>
                    ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData?.clientDistribution} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                          {chartData?.clientDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} clients`, name]} contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #f0f0f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                        }} />
                      </PieChart>
                    </ResponsiveContainer>
                    )}
                  </div>
                  
                  <div className="flex justify-around mt-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
                      <span className="text-xs md:text-sm">Returning ({returningPercentage}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-indigo-300"></div>
                      <span className="text-xs md:text-sm">New ({newPercentage}%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base md:text-lg font-semibold">Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue in {new Date().getFullYear()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px] md:h-[220px] w-full">
                    {isLoadingChartData ? (
                      <div className="flex items-center justify-center h-full">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData?.monthlyRevenue} margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0
                      }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <Tooltip formatter={(value: number) => [`£${value.toLocaleString()}`, "Revenue"]} contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #f0f0f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                        }} />
                        <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base md:text-lg font-semibold">Popular Services</CardTitle>
                  <CardDescription>Most requested services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {isLoadingChartData ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                           <Skeleton className="h-4 w-24" />
                           <Skeleton className="h-2 flex-1" />
                           <Skeleton className="h-4 w-8" />
                        </div>
                      ))
                    ) : (
                      chartData?.serviceUsage.map((service, index) => <div key={index} className="flex items-center">
                        <div className="w-24 md:w-32 font-medium text-xs md:text-sm">{service.name}</div>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{
                          width: `${service.usage}%`
                        }}></div>
                          </div>
                        </div>
                        <div className="ml-3 text-xs md:text-sm font-medium">{service.usage}%</div>
                      </div>)
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base md:text-lg font-semibold">Today's Bookings</CardTitle>
                      <CardDescription>Appointments for today</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      View All
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <div className="space-y-1 min-w-[400px]">
                    {isLoadingBranchStats ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="py-2 border-b last:border-0 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-5 w-14 rounded-full" />
                            </div>
                        </div>
                      ))
                    ) : branchStatsError ? (
                      <p className="text-red-500 text-center py-4">Error loading bookings.</p>
                    ) : branchStats?.todaysBookings && branchStats.todaysBookings.length > 0 ? (
                      branchStats.todaysBookings.map((booking, index) => {
                        const now = new Date();
                        const startTime = new Date(booking.start_time);
                        const endTime = new Date(booking.end_time);
                        let status = "Booked";
                        if (now > endTime) {
                          status = "Done";
                        } else if (now >= startTime) {
                          status = "Waiting";
                        }

                        return (
                          <BookingItem
                            key={booking.id}
                            number={`${index + 1}`}
                            staff={`${booking.staff?.first_name || 'N/A'} ${booking.staff?.last_name || ''}`}
                            client={`${booking.client?.first_name || 'N/A'} ${booking.client?.last_name || ''}`}
                            time={`${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`}
                            status={status}
                          />
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-4">No bookings for today.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base md:text-lg font-semibold">Recent Reviews</CardTitle>
                  <CardDescription>Latest client feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {isLoadingBranchStats ? (
                      Array.from({ length: 3 }).map((_, i) => <ReviewItemSkeleton key={i} />)
                    ) : branchStatsError ? (
                      <p className="text-red-500 text-center py-4">Error loading reviews.</p>
                    ) : branchStats?.latestReviews && branchStats.latestReviews.length > 0 ? (
                      branchStats.latestReviews.map((review) => {
                        const clientName = review.client ? `${review.client.first_name} ${review.client.last_name.charAt(0)}.` : 'Anonymous';
                        const staffName = review.staff ? `for ${review.staff.first_name} ${review.staff.last_name}` : '';
                        const dateText = review.created_at ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true }) : 'some time ago';
                        
                        return (
                          <ReviewItem
                            key={review.id}
                            client={clientName}
                            staff={staffName}
                            date={dateText}
                            rating={review.rating}
                            comment={review.comment || ''}
                          />
                        )
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-4">No reviews yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base md:text-lg font-semibold">Action Items</CardTitle>
                      <CardDescription>Tasks requiring attention</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      View All Tasks
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <ActionItem
                      title="Follow up with client"
                      name="Wendy Smith"
                      date="Today"
                      priority="High"
                    />
                    <ActionItem
                      title="Review care plan"
                      name="John Michael"
                      date="Tomorrow"
                      priority="Medium"
                    />
                    <ActionItem
                      title="Schedule assessment"
                      name="Lisa Rodrigues"
                      date="May 15"
                      priority="Low"
                    />
                    <ActionItem
                      title="Update medical records"
                      name="Kate Williams"
                      date="May 16"
                      priority="Medium"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base md:text-lg font-semibold">Expiry Alerts</CardTitle>
                      <CardDescription>Staff documents requiring attention</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {isLoadingBranchStats ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                          <Skeleton className="h-6 w-6 mt-1" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        </div>
                      ))
                    ) : branchStatsError ? (
                       <p className="text-red-500 text-center py-4 col-span-full">Error loading action items.</p>
                    ) : branchStats?.expiryAlerts && branchStats.expiryAlerts.length > 0 ? (
                      branchStats.expiryAlerts.map((alert) => (
                        <ActionItem
                          key={alert.id}
                          title={`Renew ${alert.document_type}`}
                          name={alert.staff ? `${alert.staff.first_name} ${alert.staff.last_name}` : 'N/A'}
                          date={alert.expiry_date ? `Expired: ${format(new Date(alert.expiry_date), 'dd MMM yyyy')}` : 'Expired'}
                          priority="High"
                        />
                      ))
                    ) : (
                       <div className="col-span-full text-center py-8 text-gray-500">
                         <ClipboardCheck className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                         <p>No urgent action items found.</p>
                       </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
        
        {activeTab === "key-parameters" && <KeyParametersContent branchId={id} branchName={branchName} />}
        
        {activeTab === "workflow" && <WorkflowContent branchId={id} branchName={branchName} />}
      
        {activeTab === "task-matrix" && <TaskMatrix branchId={id || "main"} branchName={decodeURIComponent(branchName || "Main Branch")} />}
        
        {activeTab === "training-matrix" && <TrainingMatrix branchId={id || "main"} branchName={decodeURIComponent(branchName || "Main Branch")} />}
      
        {activeTab === "bookings" && <BookingsTab branchId={id} branchName={branchName} />}
      
        {activeTab === "carers" && <CarersTab branchId={id} branchName={branchName} />}
        
        {activeTab === "clients" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold">Clients</h2>
              
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search clients..."
                    className="pl-10 pr-4 w-full"
                    value={clientSearchValue}
                    onChange={(e) => setClientSearchValue(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="New Enquiries">New Enquiries</SelectItem>
                      <SelectItem value="Actively Assessing">Actively Assessing</SelectItem>
                      <SelectItem value="Closed Enquiries">Closed Enquiries</SelectItem>
                      <SelectItem value="Former">Former</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      <SelectItem value="North">North</SelectItem>
                      <SelectItem value="South">South</SelectItem>
                      <SelectItem value="East">East</SelectItem>
                      <SelectItem value="West">West</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button onClick={handleNewClient}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Client ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingClients ? (
                    Array.from({ length: itemsPerPage }).map((_, index) => (
                      <TableRow key={`skeleton-client-${index}`}>
                          <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <div className="space-y-1">
                                <Skeleton className="h-4 w-[120px]" />
                                <Skeleton className="h-3 w-[50px]" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-[90px] rounded-full" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[70px]" /></TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Skeleton className="h-8 w-8" />
                              <Skeleton className="h-8 w-8" />
                            </div>
                          </TableCell>
                      </TableRow>
                    ))
                  ) : clientsError ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-red-500 py-8">
                        Error loading clients.
                      </TableCell>
                    </TableRow>
                  ) : clients.length > 0 ? (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.id.substring(0,8)}...</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                              {client.avatar_initials}
                            </div>
                            <div>
                              <div className="font-medium">{client.first_name} {client.last_name}</div>
                              <div className="text-xs text-gray-500">{client.region}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {client.email}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {client.phone}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {client.address}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              client.status === "Active" ? "text-green-600 bg-green-50 border-green-200" :
                              client.status === "New Enquiries" ? "text-blue-600 bg-blue-50 border-blue-200" :
                              client.status === "Actively Assessing" ? "text-amber-600 bg-amber-50 border-amber-200" :
                              client.status === "Closed Enquiries" ? "text-gray-600 bg-gray-50 border-gray-200" :
                              "text-red-600 bg-red-50 border-red-200"
                            }
                          >
                            {client.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {client.registered_on ? format(new Date(client.registered_on), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleViewClient(client)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <div className="py-8 text-center">
                          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <Search className="h-6 w-6 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No clients found</h3>
                          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {totalClients > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalClients)} of {totalClients} clients
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePreviousPage} 
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNextPage} 
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === "reviews" && <ReviewsTab branchId={id} branchName={branchName} />}
        
        {activeTab === "communication" && <CommunicationsTab branchId={id} branchName={branchName} />}
        
        {activeTab === "notifications" && restPath === "notifications" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">Notifications</h2>
            <p className="text-gray-500 mb-6">Branch: {decodeURIComponent(branchName || "")} (ID: {id})</p>
            
            <NotificationsOverview branchId={id} branchName={branchName} />
          </div>
        )}
        
        {activeTab === "notifications" && restPath !== "notifications" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">Notifications</h2>
            <p className="text-gray-500">Branch: {branchName} (ID: {id})</p>
            
            <div className="mt-6 space-y-4">
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 flex items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">System Update</h3>
                  <p className="text-sm text-gray-600 mt-1">The Med-Infinite system will be updated tonight at 2 AM. Expected downtime: 30 minutes.</p>
                  <div className="text-xs text-gray-500 mt-2">2 hours ago</div>
                </div>
              </div>
              
              <div className="p-4 border border-amber-200 rounded-lg bg-amber-50 flex items-start">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium">New Protocol</h3>
                  <p className="text-sm text-gray-600 mt-1">Updated safety protocols have been published. Please review and acknowledge by Friday.</p>
                  <div className="text-xs text-gray-500 mt-2">Yesterday</div>
                </div>
              </div>
              
              <div className="p-4 border border-green-200 rounded-lg bg-green-50 flex items-start">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">New Client Assigned</h3>
                  <p className="text-sm text-gray-600 mt-1">Emma Thompson has been assigned to your branch. Initial assessment scheduled for next week.</p>
                  <div className="text-xs text-gray-500 mt-2">2 days ago</div>
                </div>
              </div>
              
              <div className="p-4 border border-purple-200 rounded-lg bg-purple-50 flex items-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Upcoming Training</h3>
                  <p className="text-sm text-gray-600 mt-1">Mandatory training session on new medication dispensing procedures on May 15th at 10 AM.</p>
                  <div className="text-xs text-gray-500 mt-2">3 days ago</div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-start">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium">Document Expiring</h3>
                  <p className="text-sm text-gray-600 mt-1">Annual service agreement for Robert Johnson is expiring in 15 days. Please initiate renewal process.</p>
                  <div className="text-xs text-gray-500 mt-2">5 days ago</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "medication" && <MedicationTab branchId={id} branchName={branchName} />}
        
        {activeTab === "accounting" && <AccountingTab branchId={id} branchName={decodeURIComponent(branchName || "")} />}
        
        {activeTab === "care-plan" && <CareTab branchId={id} branchName={branchName} />}
        
        {activeTab === "agreements" && <BranchAgreementsTab branchId={id || ""} branchName={decodeURIComponent(branchName || "")} />}
        
        {activeTab === "forms" && <FormBuilderTab branchId={id || ""} branchName={decodeURIComponent(branchName || "")} />}
      </main>
    </div>
  );
};

export default BranchDashboard;
