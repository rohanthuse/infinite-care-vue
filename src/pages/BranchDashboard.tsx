
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { motion } from "framer-motion";
import { 
  Calendar, Users, BarChart4, Clock, 
  FileText, AlertCircle, Search, Bell,
  ChevronRight, Home, 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabNavigation } from "@/components/TabNavigation";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

// Dummy data for the chart
const weeklyData = [
  { day: "Mon", visits: 12, bookings: 8, revenue: 780 },
  { day: "Tue", visits: 19, bookings: 12, revenue: 1200 },
  { day: "Wed", visits: 15, bookings: 10, revenue: 960 },
  { day: "Thu", visits: 18, bookings: 14, revenue: 1350 },
  { day: "Fri", visits: 22, bookings: 16, revenue: 1640 },
  { day: "Sat", visits: 10, bookings: 7, revenue: 620 },
  { day: "Sun", visits: 5, bookings: 4, revenue: 380 },
];

const BranchDashboard = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const displayBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 container px-4 py-6 mx-auto">
        {/* Branch Info and Breadcrumb */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto font-normal hover:bg-transparent hover:text-blue-600"
                onClick={() => navigate("/branch")}
              >
                <Home className="h-3.5 w-3.5 mr-1" />
                Branches
              </Button>
              <ChevronRight className="h-3 w-3" />
              <span className="text-gray-700 font-medium">{displayBranchName}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {displayBranchName}
              <Badge className="ml-3 bg-green-100 text-green-800 hover:bg-green-200 font-normal" variant="outline">Active</Badge>
            </h1>
            <p className="text-gray-500 mt-1">Branch ID: {id}</p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 rounded-full bg-white border-gray-200 w-[200px] focus:w-[300px] transition-all duration-300"
              />
            </div>
            
            <Button variant="outline" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab} 
          onChange={(value) => setActiveTab(value)} 
        />
        
        {/* Dashboard Content */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          {activeTab === "dashboard" && (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              </div>
              
              {/* Main Content Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Left Column */}
                <div className="lg:col-span-2">
                  <DashboardCard 
                    title="Weekly Statistics" 
                    icon={<BarChart4 className="h-5 w-5 text-blue-600" />}
                  >
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={weeklyData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #f0f0f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                            }}
                          />
                          <Legend />
                          <Bar dataKey="visits" name="Visits" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="bookings" name="Bookings" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </DashboardCard>
                </div>
                
                {/* Right Column */}
                <div>
                  <DashboardCard 
                    title="Action Required" 
                    icon={<AlertCircle className="h-5 w-5 text-blue-600" />}
                  >
                    <div className="space-y-3">
                      <ActionItem 
                        number="1" 
                        name="Iyaniwura, Ifeoluwa" 
                        date="Thu 30/01/2025" 
                      />
                      <ActionItem 
                        number="2" 
                        name="Baulch, Ursula" 
                        date="Fri 17/01/2025" 
                      />
                      <ActionItem 
                        number="3" 
                        name="Ren, Victoria" 
                        date="Mon 20/01/2025" 
                      />
                    </div>
                  </DashboardCard>
                </div>
              </div>
              
              {/* Bottom Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardCard 
                  title="Bookings Today" 
                  icon={<Clock className="h-5 w-5 text-blue-600" />}
                >
                  <div className="space-y-3">
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
                  </div>
                </DashboardCard>
                
                <DashboardCard 
                  title="Latest Reviews" 
                  icon={<FileText className="h-5 w-5 text-blue-600" />}
                >
                  <div className="space-y-3">
                    <ReviewItem 
                      client="Pender, Eva" 
                      staff="Warren, Susan" 
                      date="26/01/2025" 
                      rating={5} 
                    />
                    <ReviewItem 
                      client="Pender, Eva" 
                      staff="Charuma, Charmaine" 
                      date="26/01/2025" 
                      rating={5} 
                    />
                    <ReviewItem 
                      client="Fulcher, Patricia" 
                      staff="Ayo-Famure, Opeyemi" 
                      date="22/01/2025" 
                      rating={4} 
                    />
                  </div>
                </DashboardCard>
              </div>
            </>
          )}
          
          {activeTab !== "dashboard" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <h2 className="text-xl font-medium text-gray-700 mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/-/g, ' ')} Page
              </h2>
              <p className="text-gray-500">
                This page is under development. Check back soon!
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

const DashboardStat = ({ 
  title, 
  value, 
  change, 
  icon,
  positive
}: { 
  title: string, 
  value: string, 
  change: string,
  icon: React.ReactNode,
  positive: boolean
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="bg-gray-50 p-3 rounded-lg">
        {icon}
      </div>
      <div className={`text-xs font-medium px-2 py-1 rounded-full ${
        positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}>
        {change}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const DashboardCard = ({ 
  title, 
  icon, 
  children, 
  fullWidth 
}: { 
  title: string, 
  icon: React.ReactNode, 
  children: React.ReactNode,
  fullWidth?: boolean
}) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${fullWidth ? 'col-span-full' : ''}`}>
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-medium text-gray-800">{title}</h3>
      </div>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

const ActionItem = ({ number, name, date }: { number: string, name: string, date: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-3">
      <div className="text-sm font-medium text-gray-500 w-6">{number}</div>
      <div>
        <p className="font-medium">{name}</p>
      </div>
    </div>
    <div className="text-sm text-gray-700">{date}</div>
  </div>
);

const BookingItem = ({ 
  number, 
  staff, 
  client, 
  time, 
  status 
}: { 
  number: string, 
  staff: string, 
  client: string, 
  time: string, 
  status: string 
}) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-3">
      <div className="text-sm font-medium text-gray-500 w-6">{number}</div>
      <div>
        <p className="font-medium">{staff}</p>
        <p className="text-xs text-gray-500">{client}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="text-sm text-gray-700">{time}</div>
      <div className={`py-1 px-2 rounded-md text-xs font-medium ${
        status === "Done" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
      }`}>
        {status}
      </div>
    </div>
  </div>
);

const ReviewItem = ({ 
  client, 
  staff, 
  date, 
  rating 
}: { 
  client: string, 
  staff: string, 
  date: string, 
  rating: number 
}) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-3">
      <div className="bg-amber-100 p-2 rounded-full">
        <Users className="h-4 w-4 text-amber-600" />
      </div>
      <div>
        <p className="font-medium">{client}</p>
        <p className="text-xs text-gray-500">Staff: {staff}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="text-xs text-gray-500">{date}</div>
      <div className="flex text-amber-500">
        {Array(rating).fill(0).map((_, i) => (
          <span key={i}>★</span>
        ))}
      </div>
    </div>
  </div>
);

export default BranchDashboard;
