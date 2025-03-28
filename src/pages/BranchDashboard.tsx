import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Routes, Route } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { motion } from "framer-motion";
import { 
  Calendar, Users, BarChart4, Clock, FileText, AlertCircle, Search, Bell, ChevronRight, Home, ArrowUpRight, Phone, Mail, MapPin, Plus, Clock7, RefreshCw, Download, Filter, ClipboardCheck, ThumbsUp, ArrowUp, ArrowDown, ChevronDown, Edit, Eye, HelpCircle, CalendarIcon, ChevronLeft
} from "lucide-react";
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

const weeklyData = [{
  day: "Mon",
  visits: 12,
  bookings: 8,
  revenue: 780
}, {
  day: "Tue",
  visits: 19,
  bookings: 12,
  revenue: 1200
}, {
  day: "Wed",
  visits: 15,
  bookings: 10,
  revenue: 960
}, {
  day: "Thu",
  visits: 18,
  bookings: 14,
  revenue: 1350
}, {
  day: "Fri",
  visits: 22,
  bookings: 16,
  revenue: 1640
}, {
  day: "Sat",
  visits: 10,
  bookings: 7,
  revenue: 620
}, {
  day: "Sun",
  visits: 5,
  bookings: 4,
  revenue: 380
}];

const monthlyRevenueData = [{
  name: "Jan",
  revenue: 4000
}, {
  name: "Feb",
  revenue: 5400
}, {
  name: "Mar",
  revenue: 5800
}, {
  name: "Apr",
  revenue: 4800
}, {
  name: "May",
  revenue: 7000
}, {
  name: "Jun",
  revenue: 6000
}, {
  name: "Jul",
  revenue: 8100
}, {
  name: "Aug",
  revenue: 7900
}, {
  name: "Sep",
  revenue: 8700
}, {
  name: "Oct",
  revenue: 9400
}, {
  name: "Nov",
  revenue: 8500
}, {
  name: "Dec",
  revenue: 11200
}];

const clientTypeData = [{
  name: "Returning",
  value: 68
}, {
  name: "New",
  value: 32
}];

const COLORS = ["#4f46e5", "#a5b4fc"];

const serviceData = [{
  name: "Home Care",
  usage: 45
}, {
  name: "Nurse Visit",
  usage: 28
}, {
  name: "Consultation",
  usage: 18
}, {
  name: "Therapy",
  usage: 9
}];

const clients = [{
  id: "CL-3421",
  name: "Wendy Smith",
  email: "wendysmith@gmail.com",
  phone: "+44 20 7946 0587",
  location: "Milton Keynes, MK9 3NZ",
  status: "Active",
  avatar: "WS",
  region: "North",
  registeredOn: "15/02/2023"
}, {
  id: "CL-2356",
  name: "John Michael",
  email: "john.michael@hotmail.com",
  phone: "+44 20 7946 1122",
  location: "London, SW1A 1AA",
  status: "New Enquiries",
  avatar: "JM",
  region: "South",
  registeredOn: "22/05/2023"
}, {
  id: "CL-9876",
  name: "Lisa Rodrigues",
  email: "lisa.rod@outlook.com",
  phone: "+44 20 7946 3344",
  location: "Cambridge, CB2 1TN",
  status: "Actively Assessing",
  avatar: "LR",
  region: "East",
  registeredOn: "10/08/2023"
}, {
  id: "CL-5432",
  name: "Kate Williams",
  email: "kate.w@company.co.uk",
  phone: "+44 20 7946 5566",
  location: "Bristol, BS1 5TR",
  status: "Closed Enquiries",
  avatar: "KW",
  region: "West",
  registeredOn: "05/11/2022"
}, {
  id: "CL-7890",
  name: "Robert Johnson",
  email: "r.johnson@gmail.com",
  phone: "+44 20 7946 7788",
  location: "Manchester, M1 1AE",
  status: "Former",
  avatar: "RJ",
  region: "North",
  registeredOn: "18/09/2022"
}, {
  id: "CL-1122",
  name: "Emma Thompson",
  email: "emma.t@gmail.com",
  phone: "+44 20 7946 9900",
  location: "Southampton, SO14 2AR",
  status: "New Enquiries",
  avatar: "ET",
  region: "South",
  registeredOn: "29/03/2023"
}, {
  id: "CL-3344",
  name: "David Wilson",
  email: "d.wilson@company.org",
  phone: "+44 20 7946 1234",
  location: "Norwich, NR1 3QU",
  status: "Active",
  avatar: "DW",
  region: "East",
  registeredOn: "13/07/2023"
}, {
  id: "CL-5566",
  name: "Olivia Parker",
  email: "olivia.p@outlook.com",
  phone: "+44 20 7946 5678",
  location: "Exeter, EX1 1LB",
  status: "Actively Assessing",
  avatar: "OP",
  region: "West",
  registeredOn: "02/01/2023"
}];

const DashboardStat = ({
  title,
  value,
  change,
  icon,
  positive
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  positive: boolean;
}) => {
  return <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <h3 className="text-lg md:text-2xl font-bold mt-1">{value}</h3>
            <div className={`flex items-center mt-1 text-xs ${positive ? 'text-green-600' : 'text-red-600'}`}>
              {positive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              <span>{change}</span>
            </div>
          </div>
          <div className="p-2 rounded-md bg-gray-50 border border-gray-100">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>;
};

const BookingItem = ({
  number,
  staff,
  client,
  time,
  status
}: {
  number: string;
  staff: string;
  client: string;
  time: string;
  status: string;
}) => {
  let statusColor = "bg-gray-100 text-gray-600";
  if (status === "Done") statusColor = "bg-green-100 text-green-700";else if (status === "Booked") statusColor = "bg-blue-100 text-blue-700";else if (status === "Waiting") statusColor = "bg-amber-100 text-amber-700";
  return <div className="py-2 border-b last:border-0 flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-5 text-xs text-gray-500 mr-2">{number}.</div>
        <div>
          <div className="text-xs md:text-sm font-medium">{staff}</div>
          <div className="text-xs text-gray-500">{client}</div>
        </div>
      </div>
      <div className="flex items-center">
        <div className="flex items-center mr-3">
          <Clock className="h-3 w-3 text-gray-400 mr-1" />
          <span className="text-xs text-gray-600">{time}</span>
        </div>
        <div className={`${statusColor} rounded-full px-2 py-0.5 text-xs font-medium`}>
          {status}
        </div>
      </div>
    </div>;
};

const ReviewItem = ({
  client,
  staff,
  date,
  rating,
  comment
}: {
  client: string;
  staff: string;
  date: string;
  rating: number;
  comment: string;
}) => {
  return <div className="py-2 border-b last:border-0">
      <div className="flex justify-between">
        <div>
          <div className="text-xs md:text-sm font-medium">{client}</div>
          <div className="text-xs text-gray-500">for {staff}</div>
        </div>
        <div className="text-xs text-gray-500">{date}</div>
      </div>
      <div className="flex items-center mt-1">
        <div className="flex">
          {Array(rating).fill(0).map((_, i) => <ThumbsUp key={i} className="h-3 w-3 text-yellow-500" />)}
        </div>
        <p className="ml-2 text-xs md:text-sm text-gray-700">{comment}</p>
      </div>
    </div>;
};

const ActionItem = ({
  title,
  name,
  date,
  priority
}: {
  title: string;
  name: string;
  date: string;
  priority: string;
}) => {
  let priorityColor = "bg-gray-100 text-gray-600";
  if (priority === "High") priorityColor = "bg-red-100 text-red-700";else if (priority === "Medium") priorityColor = "bg-amber-100 text-amber-700";else if (priority === "Low") priorityColor = "bg-green-100 text-green-700";
  return <div className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className={`${priorityColor} rounded-full px-2 py-0.5 text-xs font-medium`}>
          {priority}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-600">{name}</div>
        <div className="flex items-center text-gray-500">
          <CalendarIcon className="h-3 w-3 mr-1" />
          {date}
        </div>
      </div>
    </div>;
};

const BranchDashboard = () => {
  const {
    id,
    branchName,
    "*": restPath
  } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    if (restPath) {
      if (restPath.startsWith("key-parameters")) return "key-parameters";
      if (restPath.startsWith("workflow")) return "workflow";
      if (restPath.startsWith("bookings")) return "bookings";
      if (restPath.startsWith("carers")) return "carers";
      if (restPath.startsWith("clients")) return "clients";
      if (restPath.startsWith("reviews")) return "reviews";
      if (restPath.startsWith("communication")) return "communication";
      if (restPath.startsWith("notifications")) return "notifications";
      if (restPath.startsWith("medication")) return "medication";
    }
    return "dashboard";
  });

  const [searchValue, setSearchValue] = useState("");
  const [clientSearchValue, setClientSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const itemsPerPage = 5;
  const displayBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(clientSearchValue.toLowerCase()) || client.email.toLowerCase().includes(clientSearchValue.toLowerCase()) || client.id.toLowerCase().includes(clientSearchValue.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesRegion = regionFilter === "all" || client.region === regionFilter;
    return matchesSearch && matchesStatus && matchesRegion;
  });
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (newTab === "workflow") {
      handleWorkflowNavigation("workflow");
    } else if (newTab === "key-parameters") {
      handleWorkflowNavigation("key-parameters");
    } else if (newTab === "task-matrix") {
      handleWorkflowNavigation("task-matrix");
    } else if (newTab === "notifications") {
      handleWorkflowNavigation("notifications");
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, regionFilter, clientSearchValue]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <AddClientDialog open={addClientDialogOpen} onOpenChange={setAddClientDialogOpen} />
      
      <NewBookingDialog open={newBookingDialogOpen} onOpenChange={setNewBookingDialogOpen} clients={mockClients} carers={mockCarers} onCreateBooking={handleCreateBooking} />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-20 md:py-6 w-full">
        <BranchInfoHeader 
          branchName={decodeURIComponent(branchName || "Med-Infinite Branch")} 
          branchId={id || ""}
          onNewBooking={handleNewBooking}
        />
        
        <div className="mb-6">
          <TabNavigation 
            activeTab={activeTab} 
            onChange={(tab) => {
              setActiveTab(tab);
              
              if (tab === "dashboard") {
                navigate(`/branch-dashboard/${id}/${branchName}`);
              } else if (tab === "key-parameters") {
                navigate(`/branch-dashboard/${id}/${branchName}/key-parameters`);
              } else if (tab === "workflow") {
                navigate(`/branch-dashboard/${id}/${branchName}/workflow`);
              } else {
                navigate(`/branch-dashboard/${id}/${branchName}/${tab}`);
              }
            }}
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
              <DashboardStat title="Total Clients" value="128" change="+12%" icon={<Users className="h-5 w-5 text-blue-600" />} positive={true} />
              <DashboardStat title="Today's Bookings" value="24" change="+8%" icon={<Calendar className="h-5 w-5 text-green-600" />} positive={true} />
              <DashboardStat title="Pending Reviews" value="7" change="-3%" icon={<FileText className="h-5 w-5 text-amber-600" />} positive={false} />
              <DashboardStat title="Monthly Revenue" value="£18,947" change="+15.3%" icon={<BarChart4 className="h-5 w-5 text-purple-600" />} positive={true} />
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
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData} margin={{
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
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={clientTypeData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                          {clientTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={value => [`${value}%`, "Percentage"]} contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #f0f0f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                        }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex justify-around mt-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
                      <span className="text-xs md:text-sm">Returning (68%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-indigo-300"></div>
                      <span className="text-xs md:text-sm">New (32%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base md:text-lg font-semibold">Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue in 2025</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px] md:h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyRevenueData} margin={{
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
                        <Tooltip formatter={value => [`£${value}`, "Revenue"]} contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #f0f0f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                        }} />
                        <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
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
                    {serviceData.map((service, index) => <div key={index} className="flex items-center">
                        <div className="w-24 md:w-32 font-medium text-xs md:text-sm">{service.name}</div>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{
                          width: `${service.usage}%`
                        }}></div>
                          </div>
                        </div>
                        <div className="ml-3 text-xs md:text-sm font-medium">{service.usage}%</div>
                      </div>)}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base md:text-lg font-semibold">Today's Bookings</CardTitle>
                    <CardDescription>Appointments for today</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    View All
                    <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <div className="space-y-1 min-w-[400px]">
                    <BookingItem
                      number="1"
                      staff="Dr. James Wilson"
                      client="Wendy Smith"
                      time="09:00 AM"
                      status="Done"
                    />
                    <BookingItem
                      number="2"
                      staff="Nurse Sarah Johnson"
                      client="John Michael"
                      time="10:30 AM"
                      status="Done"
                    />
                    <BookingItem
                      number="3"
                      staff="Dr. Emma Thompson"
                      client="Lisa Rodrigues"
                      time="11:45 AM"
                      status="Booked"
                    />
                    <BookingItem
                      number="4"
                      staff="Nurse David Wilson"
                      client="Kate Williams"
                      time="02:15 PM"
                      status="Waiting"
                    />
                    <BookingItem
                      number="5"
                      staff="Dr. Michael Scott"
                      client="Robert Johnson"
                      time="03:30 PM"
                      status="Booked"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base md:text-lg font-semibold">Recent Reviews</CardTitle>
                    <CardDescription>Latest client feedback</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    View All
                    <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <ReviewItem
                      client="Wendy S."
                      staff="Dr. James Wilson"
                      date="Today"
                      rating={5}
                      comment="Excellent service and care. Very attentive to my needs."
                    />
                    <ReviewItem
                      client="John M."
                      staff="Nurse Sarah Johnson"
                      date="Yesterday"
                      rating={4}
                      comment="Professional and caring. Would recommend."
                    />
                    <ReviewItem
                      client="Lisa R."
                      staff="Dr. Emma Thompson"
                      date="2 days ago"
                      rating={5}
                      comment="Amazing experience. Dr. Thompson was very thorough."
                    />
                    <ReviewItem
                      client="Kate W."
                      staff="The Clinic"
                      date="3 days ago"
                      rating={3}
                      comment="Good service but had to wait a bit longer than expected."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:gap-6">
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
          </motion.div>
        )}
        
        {activeTab === "key-parameters" && <KeyParametersContent branchId={id} branchName={branchName} />}
        
        {activeTab === "workflow" && <WorkflowContent branchId={id} branchName={branchName} />}
      
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
                  {paginatedClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                            {client.avatar}
                          </div>
                          <div>
                            <div className="font-medium">{client.name}</div>
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
                        {client.location}
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
                        {client.registeredOn}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredClients.length > 0 ? (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} clients
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
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Search className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No clients found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === "reviews" && <ReviewsTab branchId={id} branchName={branchName} />}
        
        {activeTab === "communication" && <CommunicationsTab branchId={id} branchName={branchName} />}
        
        {activeTab === "notifications" && (
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
      </main>
    </div>
  );
};

export default BranchDashboard;
