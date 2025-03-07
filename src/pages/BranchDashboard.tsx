import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { motion } from "framer-motion";
import { Calendar, Users, BarChart4, Clock, FileText, AlertCircle, Search, Bell, ChevronRight, Home, ArrowUpRight, Phone, Mail, MapPin, Plus, Clock7, RefreshCw, Download, Filter, ClipboardCheck, ThumbsUp, ArrowUp, ArrowDown, ChevronDown, Edit, Eye, HelpCircle, CalendarIcon, ChevronLeft } from "lucide-react";
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

const data = [
  { name: 'Jan', bookings: 4000, clients: 2400, amt: 2400 },
  { name: 'Feb', bookings: 3000, clients: 1398, amt: 2210 },
  { name: 'Mar', bookings: 2000, clients: 9800, amt: 2290 },
  { name: 'Apr', bookings: 2780, clients: 3908, amt: 2000 },
  { name: 'May', bookings: 1890, clients: 4800, amt: 2181 },
  { name: 'Jun', bookings: 2390, clients: 3800, amt: 2500 },
  { name: 'Jul', bookings: 3490, clients: 4300, amt: 2100 },
  { name: 'Aug', bookings: 4000, clients: 2400, amt: 2400 },
  { name: 'Sep', bookings: 3000, clients: 1398, amt: 2210 },
  { name: 'Oct', bookings: 2000, clients: 9800, amt: 2290 },
  { name: 'Nov', bookings: 2780, clients: 3908, amt: 2000 },
  { name: 'Dec', bookings: 1890, clients: 4800, amt: 2181 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const pieData = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 p-2 rounded-md shadow-md">
        <p className="font-semibold">{`${label}`}</p>
        {payload.map((item: any) => (
          <p key={item.name} className="text-gray-700">
            {`${item.name}: ${item.value}`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

const EventItem = ({ event }: any) => (
  <li className="py-2 border-b border-gray-200 last:border-b-0">
    <div className="flex items-center space-x-3">
      <Clock className="h-4 w-4 text-gray-500" />
      <div>
        <h4 className="text-sm font-semibold text-gray-800">{event.title}</h4>
        <p className="text-xs text-gray-500">{event.time}</p>
      </div>
    </div>
  </li>
);

const TaskItem = ({ task }: any) => (
  <li className="py-2 border-b border-gray-200 last:border-b-0">
    <div className="flex items-center space-x-3">
      <FileText className="h-4 w-4 text-gray-500" />
      <div>
        <h4 className="text-sm font-semibold text-gray-800">{task.title}</h4>
        <p className="text-xs text-gray-500">{task.status}</p>
      </div>
    </div>
  </li>
);

const ClientRow = ({ client }: any) => (
  <TableRow>
    <TableCell className="font-medium">{client.name}</TableCell>
    <TableCell>{client.phone}</TableCell>
    <TableCell>{client.email}</TableCell>
    <TableCell className="text-right">
      <Button variant="ghost" size="sm">
        <Eye className="h-4 w-4 mr-2" /> View
      </Button>
    </TableCell>
  </TableRow>
);

const BookingRow = ({ booking }: any) => (
  <TableRow>
    <TableCell className="font-medium">{booking.client}</TableCell>
    <TableCell>{booking.service}</TableCell>
    <TableCell>{format(new Date(booking.date), "MMM d, yyyy")}</TableCell>
    <TableCell>{booking.time}</TableCell>
    <TableCell className="text-right">
      <Badge className={`bg-${booking.status === 'Confirmed' ? 'green' : 'yellow'}-100 text-${booking.status === 'Confirmed' ? 'green' : 'yellow'}-600`}>{booking.status}</Badge>
    </TableCell>
  </TableRow>
);

const BranchDashboard = () => {
  const { branchId, branchName } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isNewBookingDialogOpen, setIsNewBookingDialogOpen] = useState(false);
  const [selectedBookingFilter, setSelectedBookingFilter] = useState("All");
  const [selectedBookingStatus, setSelectedBookingStatus] = useState("All");
  const [selectedDateRange, setSelectedDateRange] = useState("week");
  const decodedBranchName = branchName ? decodeURIComponent(branchName) : "Branch";
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <div>Dashboard Content</div>;
      case "bookings":
        return <div>Bookings Content</div>;
      case "clients":
        return <div>Clients Content</div>;
      case "carers":
        return <div>Carers Content</div>;
      case "reviews":
        return <div>Reviews Content</div>;
      case "communication":
        return <div>Communication Content</div>;
      default:
        return <div>Dashboard Content</div>;
    }
  };

  const handleBookingFilterChange = (filter: string) => {
    setSelectedBookingFilter(filter);
  };

  const handleBookingStatusChange = (status: string) => {
    setSelectedBookingStatus(status);
  };

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <DashboardHeader 
        branchName={decodedBranchName} 
        onBack={() => navigate('/dashboard')} 
      />
      
      <div className="mt-8">
        <TabNavigation 
          activeTab={activeTab} 
          onChange={handleTabChange} 
        />
      </div>
      
      {activeTab === "dashboard" && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Upcoming Bookings</p>
                    <h3 className="text-2xl font-bold mt-1">48</h3>
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      12% from last week
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4 text-sm border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={() => handleTabChange("bookings")}
                >
                  Schedule
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Clients</p>
                    <h3 className="text-2xl font-bold mt-1">156</h3>
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      4% from last month
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4 text-sm border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={() => handleTabChange("clients")}
                >
                  View Clients
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Carers</p>
                    <h3 className="text-2xl font-bold mt-1">64</h3>
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      7% from last month
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4 text-sm border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={() => handleTabChange("carers")}
                >
                  Manage Carers
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Branch Rating</p>
                    <h3 className="text-2xl font-bold mt-1">4.8/5</h3>
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      0.3 from last quarter
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <BarChart4 className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4 text-sm border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={() => handleTabChange("carers")}
                >
                  Reports
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Bookings Overview</CardTitle>
              <CardDescription>Summary of bookings for the branch</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid stroke="#f5f5f5" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="bookings" stroke="#8884d8" name="Bookings" />
                  <Line type="monotone" dataKey="clients" stroke="#82ca9d" name="Clients" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Task List</CardTitle>
                <CardDescription>Important tasks for today</CardDescription>
              </CardHeader>
              <CardContent>
                <ul>
                  <TaskItem task={{ title: "Review pending invoices", status: "Due in 2 days" }} />
                  <TaskItem task={{ title: "Confirm upcoming appointments", status: "Pending" }} />
                  <TaskItem task={{ title: "Send follow-up emails", status: "Completed" }} />
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Scheduled events for the week</CardDescription>
              </CardHeader>
              <CardContent>
                <ul>
                  <EventItem event={{ title: "Staff Meeting", time: "10:00 AM - 11:00 AM" }} />
                  <EventItem event={{ title: "Client Consultation", time: "2:00 PM - 3:00 PM" }} />
                  <EventItem event={{ title: "Training Session", time: "3:30 PM - 4:30 PM" }} />
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {activeTab === "bookings" && <BookingsTab />}
      {activeTab === "carers" && <CarersTab />}
      {activeTab === "reviews" && <ReviewsTab />}
      {activeTab === "communication" && <CommunicationsTab />}
      
      <AddClientDialog 
        open={isAddClientDialogOpen} 
        onOpenChange={setIsAddClientDialogOpen} 
      />
      
      <NewBookingDialog 
        open={isNewBookingDialogOpen} 
        onOpenChange={setIsNewBookingDialogOpen} 
      />
    </div>
  );
};

export default BranchDashboard;
