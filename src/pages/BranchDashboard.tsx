
import React from "react";
import { useParams } from "react-router-dom";
import { BranchSidebar } from "@/components/BranchSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { motion } from "framer-motion";
import { 
  Calendar, Users, BarChart4, Clock, 
  FileText, AlertCircle
} from "lucide-react";

const BranchDashboard = () => {
  const { id, branchName } = useParams();
  
  // This would typically come from an API based on the branch ID
  const displayBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <div className="flex flex-1">
        <BranchSidebar branchName={displayBranchName} />
        
        <motion.main 
          className="flex-1 ml-64 px-6 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500">Welcome to {displayBranchName} dashboard</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <DashboardCard 
              title="Upcoming Birthdays" 
              icon={<Calendar className="h-5 w-5 text-blue-600" />}
            >
              <div className="space-y-3">
                <BirthdayItem name="Ahmad, Dilwar" type="Client" date="20 Mar" />
                <BirthdayItem name="Pender, Eva" type="Client" date="16 Apr" />
              </div>
            </DashboardCard>
            
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
              </div>
            </DashboardCard>
            
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
              </div>
            </DashboardCard>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard 
              title="Weekly Statistics" 
              icon={<BarChart4 className="h-5 w-5 text-blue-600" />}
              fullWidth
            >
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">Bar chart to be implemented</p>
              </div>
            </DashboardCard>
            
            <DashboardCard 
              title="Latest Reviews" 
              icon={<FileText className="h-5 w-5 text-blue-600" />}
              fullWidth
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
              </div>
            </DashboardCard>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

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
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${fullWidth ? 'col-span-full' : ''}`}>
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

const BirthdayItem = ({ name, type, date }: { name: string, type: string, date: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-3">
      <div className="bg-gray-100 p-2 rounded-full">
        <Users className="h-4 w-4 text-gray-600" />
      </div>
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-xs text-gray-500">{type}</p>
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
