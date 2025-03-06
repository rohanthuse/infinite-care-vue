import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { motion } from "framer-motion";
import { 
  Calendar, Users, BarChart4, Clock, 
  FileText, AlertCircle, Search, Bell,
  ChevronRight, Home, ArrowUpRight,
  Phone, Mail, MapPin, Plus, Clock7,
  RefreshCw, Download, Filter, 
  ClipboardCheck, ThumbsUp, ArrowUp, ArrowDown,
  ChevronDown, Edit, Eye, HelpCircle,
  CalendarIcon, ChevronLeft, MessageCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabNavigation } from "@/components/TabNavigation";
import { BookingsTab } from "@/components/bookings/BookingsTab";
import { CarersTab } from "@/components/carers/CarersTab";
import ReviewsTab from "@/components/reviews/ReviewsTab";
import CommTab from "@/components/communications/CommTab";
import { AddClientDialog } from "@/components/AddClientDialog";
import { NewBookingDialog } from "@/components/bookings/NewBookingDialog";

const weeklyData = [
  { day: "Mon", visits: 12, bookings: 8, revenue: 780 },
  { day: "Tue", visits: 19, bookings: 12, revenue: 1200 },
  { day: "Wed", visits: 15, bookings: 10, revenue: 960 },
  { day: "Thu", visits: 18, bookings: 14, revenue: 1350 },
  { day: "Fri", visits: 22, bookings: 16, revenue: 1640 },
  { day: "Sat", visits: 10, bookings: 7, revenue: 620 },
  { day: "Sun", visits: 5, bookings: 4, revenue: 380 },
];

const monthlyRevenueData = [
  { name: "Jan", revenue: 4000 },
  { name: "Feb", revenue: 5400 },
  { name: "Mar", revenue: 5800 },
  { name: "Apr", revenue: 4800 },
  { name: "May", revenue: 7000 },
  { name: "Jun", revenue: 6000 },
  { name: "Jul", revenue: 8100 },
  { name: "Aug", revenue: 7900 },
  { name: "Sep", revenue: 8700 },
  { name: "Oct", revenue: 9400 },
  { name: "Nov", revenue: 8500 },
  { name: "Dec", revenue: 11200 },
];

const clientTypeData = [
  { name: "Returning", value: 68 },
  { name: "New", value: 32 },
];

const COLORS = ["#4f46e5", "#a5b4fc"];

const serviceData = [
  { name: "Home Care", usage: 45 },
  { name: "Nurse Visit", usage: 28 },
  { name: "Consultation", usage: 18 },
  { name: "Therapy", usage: 9 },
];

const clients = [
  {
    id: "CL-3421",
    name: "Wendy Smith",
    email: "wendysmith@gmail.com",
    phone: "+44 20 7946 0587",
    location: "Milton Keynes, MK9 3NZ",
    status: "Active",
    avatar: "WS",
    region: "North",
    registeredOn: "15/02/2023"
  },
  {
    id: "CL-2356",
    name: "John Michael",
    email: "john.michael@hotmail.com",
    phone: "+44 20 7946 1122",
    location: "London, SW1A 1AA",
    status: "New Enquiries",
    avatar: "JM",
    region: "South",
    registeredOn: "22/05/2023"
  },
  {
    id: "CL-9876",
    name: "Lisa Rodrigues",
    email: "lisa.rod@outlook.com",
    phone: "+44 20 7946 3344",
    location: "Cambridge, CB2 1TN",
    status: "Actively Assessing",
    avatar: "LR",
    region: "East",
    registeredOn: "10/08/2023"
  },
  {
    id: "CL-5432",
    name: "Kate Williams",
    email: "kate.w@company.co.uk",
    phone: "+44 20 7946 5566",
    location: "Bristol, BS1 5TR",
    status: "Closed Enquiries",
    avatar: "KW",
    region: "West",
    registeredOn: "05/11/2022"
  },
  {
    id: "CL-7890",
    name: "Robert Johnson",
    email: "r.johnson@gmail.com",
    phone: "+44 20 7946 7788",
    location: "Manchester, M1 1AE",
    status: "Former",
    avatar: "RJ",
    region: "North",
    registeredOn: "18/09/2022"
  },
  {
    id: "CL-1122",
    name: "Emma Thompson",
    email: "emma.t@gmail.com",
    phone: "+44 20 7946 9900",
    location: "Southampton, SO14 2AR",
    status: "New Enquiries",
    avatar: "ET",
    region: "South",
    registeredOn: "29/03/2023"
  },
  {
    id: "CL-3344",
    name: "David Wilson",
    email: "d.wilson@company.org",
    phone: "+44 20 7946 1234",
    location: "Norwich, NR1 3QU",
    status: "Active",
    avatar: "DW",
    region: "East",
    registeredOn: "13/07/2023"
  },
  {
    id: "CL-5566",
    name: "Olivia Parker",
    email: "olivia.p@outlook.com",
    phone: "+44 20 7946 5678",
    location: "Exeter, EX1 1LB",
    status: "Actively Assessing",
    avatar: "OP",
    region: "West",
    registeredOn: "02/01/2023"
  },
];

const BranchDashboard = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
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
    const matchesSearch = 
      client.name.toLowerCase().includes(clientSearchValue.toLowerCase()) ||
      client.email.toLowerCase().includes(clientSearchValue.toLowerCase()) ||
      client.id.toLowerCase().includes(clientSearchValue.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesRegion = regionFilter === "all" || client.region === regionFilter;
    
    return matchesSearch && matchesStatus && matchesRegion;
  });
  
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
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

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, regionFilter, clientSearchValue]);
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <AddClientDialog 
        open={addClientDialogOpen} 
        onOpenChange={setAddClientDialogOpen} 
      />
      
      <NewBookingDialog
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        clients={mockClients}
        carers={mockCarers}
        onCreateBooking={handleCreateBooking}
      />
      
      <main className="flex-1 container px-4 pt-4 pb-20 md:py-6 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6">
          <div className="w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto font-normal hover:bg-transparent hover:text-blue-600"
                onClick={() => navigate("/branch")}
              >
                <Home className="h-3 w-3 mr-1" />
                <span className="hidden md:inline">Branches</span>
              </Button>
              <ChevronRight className="h-3 w-3" />
              <span className="text-gray-700 font-medium text-xs md:text-sm truncate max-w-[150px] md:max-w-[200px]">{displayBranchName}</span>
            </div>
            
            <h1 className="text-lg md:text-3xl font-bold text-gray-800 flex items-center">
              {displayBranchName}
              <Badge className="ml-2 md:ml-3 bg-green-100 text-green-800 hover:bg-green-200 font-normal text-xs md:text-sm" variant="outline">Active</Badge>
            </h1>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2">
              <div className="flex items-center text-xs md:text-sm text-gray-600">
                <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 text-gray-500" />
                <span>Milton Keynes, UK</span>
              </div>
              <div className="flex items-center text-xs md:text-sm text-gray-600">
                <Phone className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 text-gray-500" />
                <span>+44 20 7946 0958</span>
              </div>
              <div className="flex items-center text-xs md:text-sm text-gray-600">
                <Mail className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 text-gray-500" />
                <span>milton@med-infinite.com</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button 
              variant="default" 
              className="h-9 bg-blue-600 hover:bg-blue-700 rounded-full px-3 shadow-sm"
              onClick={handleNewBooking}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>New Booking</span>
            </Button>
          </div>
        </div>
        
        <TabNavigation 
          activeTab={activeTab} 
          onChange={(value) => setActiveTab(value)} 
          hideActionsOnMobile={true}
          hideQuickAdd={true}
        />
        
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 md:mt-6"
        >
          {activeTab === "dashboard" && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button 
                  variant="outline" 
                  className="h-auto py-3 px-4 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-left justify-start"
                  onClick={handleNewClient}
                >
                  <div className="mr-2 md:mr-3 h-7 md:h-8 w-7 md:w-8 rounded-md bg-blue-100 flex items-center justify-center">
                    <Plus className="h-3.5 md:h-4 w-3.5 md:w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-xs md:text-sm">New Client</div>
                    <div className="text-xs text-gray-500 hidden md:block">Add client details</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-auto py-3 px-4 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-left justify-start">
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
                
                <Button variant="outline" className="h-auto py-3 px-4 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-left justify-start">
                  <div className="mr-2 md:mr-3 h-7 md:h-8 w-7 md:w-8 rounded-md bg-purple-100 flex items-center justify-center">
                    <Users className="h-3.5 md:h-4 w-3.5 md:w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-xs md:text-sm">Staff</div>
                    <div className="text-xs text-gray-500 hidden md:block">Manage staff</div>
                  </div>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
                <DashboardStat 
                  title="Total Clients" 
                  value="128" 
                  change="+12%" 
                  icon={<Users className="h-5 w-5 text-blue-600" />}
                  positive={true}
                />
                <DashboardStat 
                  title="Today's Bookings" 
                  value="24" 
                  change="+8%" 
                  icon={<Calendar className="h-5 w-5 text-green-600" />}
                  positive={true}
                />
                <DashboardStat 
                  title="Pending Reviews" 
                  value="7" 
                  change="-3%" 
                  icon={<FileText className="h-5 w-5 text-amber-600" />}
                  positive={false}
                />
                <DashboardStat 
                  title="Monthly Revenue" 
                  value="£18,947" 
                  change="+15.3%" 
                  icon={<BarChart4 className="h-5 w-5 text-purple-600" />}
                  positive={true}
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
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={weeklyData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="day" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #f0f0f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                            }}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="visits" name="Visits" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
                          <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (£)" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
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
                          <Pie
                            data={clientTypeData}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {clientTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value}%`, "Percentage"]}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #f0f0f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                            }}
                          />
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
                        <AreaChart
                          data={monthlyRevenueData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <Tooltip
                            formatter={(value) => [`£${value}`, "Revenue"]}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #f0f0f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                            }}
                          />
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
                      {serviceData.map((service, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-24 md:w-32 font-medium text-xs md:text-sm">{service.name}</div>
                          <div className="flex-1">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 rounded-full" 
                                style={{ width: `${service.usage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="ml-3 text-xs md:text-sm font-medium">{service.usage}%</div>
                        </div>
                      ))}
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
                        staff="Charuma, Charmaine" 
                        client="Fulcher, Patricia" 
                        time="07:30 - 08:30" 
                        status="Done" 
                      />
                      <BookingItem 
                        number="2" 
                        staff="Ayo-Famure, Opeyemi" 
                        client="Ltd, Careville" 
                        time="08:30 - 09:15" 
                        status="Booked" 
                      />
                      <BookingItem 
                        number="3" 
                        staff="Warren, Susan" 
                        client="Baulch, Ursula" 
                        time="10:00 - 11:00" 
                        status="Booked" 
                      />
                      <BookingItem 
                        number="4" 
                        staff="Warren, Susan" 
                        client="Ren, Victoria" 
                        time="11:30 - 12:30" 
                        status="Waiting" 
                      />
                      <BookingItem 
                        number="5" 
                        staff="Charuma, Charmaine" 
                        client="Iyaniwura, Ifeoluwa" 
                        time="14:00 - 15:00" 
                        status="Booked" 
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base md:text-lg font-semibold">Latest Reviews</CardTitle>
                      <CardDescription>Client feedback</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      View All
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <ReviewItem 
                        client="Pender, Eva" 
                        staff="Warren, Susan" 
                        date="26/01/2025" 
                        rating={5} 
                        comment="Excellent care and attention to detail."
                      />
                      <ReviewItem 
                        client="Pender, Eva" 
                        staff="Charuma, Charmaine" 
                        date="26/01/2025" 
                        rating={5} 
                        comment="Very professional and friendly service."
                      />
                      <ReviewItem 
                        client="Fulcher, Patricia" 
                        staff="Ayo-Famure, Opeyemi" 
                        date="22/01/2025" 
                        rating={4} 
                        comment="Good service but arrived a bit late."
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="mb-20 md:mb-6">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                    <CardTitle className="text-base md:text-lg font-semibold">Action Required</CardTitle>
                  </div>
                  <CardDescription>Tasks that need your immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ActionItem 
                      title="Care Plan Update" 
                      name="Iyaniwura, Ifeoluwa" 
                      date="Thu 30/01/2025" 
                      priority="High"
                    />
                    <ActionItem 
                      title="Medication Review" 
                      name="Baulch, Ursula" 
                      date="Fri 17/01/2025" 
                      priority="Medium"
                    />
                    <ActionItem 
                      title="Staff Training" 
                      name="Warren, Susan" 
                      date="Mon 20/01/2025" 
                      priority="Medium"
                    />
                    <ActionItem 
                      title="Client Assessment" 
                      name="Ren, Victoria" 
                      date="Wed 22/01/2025" 
                      priority="Low"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {activeTab === "clients" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold">Clients</h2>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleNewClient}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Client
                </Button>
              </div>
              
              <div className="p-4 border-b border-gray-100 bg-gray-50/80">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search clients..."
                      className="pl-10 pr-4"
                      value={clientSearchValue}
                      onChange={(e) => setClientSearchValue(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="New Enquiries">New Enquiries</SelectItem>
                        <SelectItem value="Actively Assessing">Actively Assessing</SelectItem>
                        <SelectItem value="Closed Enquiries">Closed Enquiries</SelectItem>
                        <SelectItem value="Former">Former</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={regionFilter} onValueChange={setRegionFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        <SelectItem value="North">North</SelectItem>
                        <SelectItem value="South">South</SelectItem>
                        <SelectItem value="East">East</SelectItem>
                        <SelectItem value="West">West</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          <span>{fromDate ? format(fromDate, 'PP') : 'Date Range'}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          initialFocus
                          mode="range"
                          defaultMonth={fromDate}
                          selected={{
                            from: fromDate,
                            to: toDate,
                          }}
                          onSelect={(range) => {
                            setFromDate(range?.from);
                            setToDate(range?.to);
                          }}
                          numberOfMonths={1}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Client ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Contact</TableHead>
                      <TableHead className="hidden md:table-cell">Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Registered On</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                              {client.avatar}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{client.name}</div>
                              <div className="text-xs text-gray-500">{client.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{client.phone}</TableCell>
                        <TableCell className="hidden md:table-cell">{client.location}</TableCell>
                        <TableCell>
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {client.status}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{client.registeredOn}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
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
            </div>
          )}
          
          {activeTab === "bookings" && (
            <BookingsTab branchId={id || ""} />
          )}
          
          {activeTab === "carers" && (
            <CarersTab branchId={id || ""} />
          )}
          
          {activeTab === "reviews" && (
            <ReviewsTab />
          )}
          
          {activeTab === "communications" && (
            <CommTab branchId={id || ""} />
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default BranchDashboard;
